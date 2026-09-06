#!/usr/bin/env bash
# ============================================================
# EnergiKita — Deployment Script
# ============================================================
# Script ini membangun frontend (Vite) dan menyalin hasil build
# ke backend/public/ agar bisa dilayani oleh Laravel (Apache/Nginx).
#
# Cara pakai:
#   chmod +x deploy.sh
#   ./deploy.sh
#
# Atau jalankan per tahap:
#   ./deploy.sh --build       # Build frontend saja
#   ./deploy.sh --copy        # Salin dist/ ke backend/public/
#   ./deploy.sh --full        # Build + copy + info
# ============================================================

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR"
DIST_DIR="$ROOT_DIR/dist"
PUBLIC_DIR="$BACKEND_DIR/public"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

info()  { echo -e "${CYAN}[INFO]${NC} $1"; }
ok()    { echo -e "${GREEN}[  OK]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
fail()  { echo -e "${RED}[FAIL]${NC} $1"; exit 1; }

# --------------------------------------------------
# 1. Build Frontend
# --------------------------------------------------
do_build() {
    info "Memeriksa node_modules..."
    if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
        info "Installing dependencies..."
        cd "$FRONTEND_DIR" && npm install
    fi

    info "Building frontend untuk production..."
    cd "$FRONTEND_DIR"
    rm -rf dist
    npm run build
    ok "Frontend berhasil dibangun → dist/"
}

# --------------------------------------------------
# 2. Copy dist/ ke backend/public/
# --------------------------------------------------
do_copy() {
    if [ ! -d "$DIST_DIR" ]; then
        fail "dist/ tidak ditemukan. Jalankan: ./deploy.sh --build"
    fi

    info "Menyalin hasil build ke backend/public/..."

    # Backup file penting Laravel di public/
    BACKUP_ITEMS=()
    for f in index.php .htaccess favicon.ico robots.txt; do
        if [ -f "$PUBLIC_DIR/$f" ]; then
            cp "$PUBLIC_DIR/$f" "/tmp/$f.bak"
            BACKUP_ITEMS+=("$f")
        fi
    done

    # Hapus semua isi public/ (kecuali .gitignore)
    find "$PUBLIC_DIR" -maxdepth 1 ! -name '.gitignore' ! -name 'public' -exec rm -rf {} + 2>/dev/null || true

    # Salin isi dist/ ke public/
    cp -r "$DIST_DIR"/* "$PUBLIC_DIR/"

    # Restore file Laravel
    for f in "${BACKUP_ITEMS[@]}"; do
        if [ -f "/tmp/$f.bak" ]; then
            mv "/tmp/$f.bak" "$PUBLIC_DIR/$f"
        fi
    done

    # Pastikan Laravel routing tetap jalan
    # File .htaccess dari Laravel harus ada
    if [ ! -f "$PUBLIC_DIR/.htaccess" ]; then
        warn ".htaccess Laravel tidak ditemukan — mungkin perlu dikembalikan manual."
    fi

    # Salin robots.txt jika belum ada
    if [ ! -f "$PUBLIC_DIR/robots.txt" ]; then
        cat > "$PUBLIC_DIR/robots.txt" << 'ROBOTS'
User-agent: *
Allow: /
Disallow: /api/
Disallow: /storage/
Sitemap: https://domain-kamu.domainsiasia.co.id/sitemap.xml
ROBOTS
        warn "robots.txt dibuat secara otomatis. Edit domain di backend/public/robots.txt"
    fi

    ok "File frontend tersalin ke backend/public/"
}

# --------------------------------------------------
# 3. Print Deployment Info
# --------------------------------------------------
do_info() {
    echo ""
    echo "============================================================"
    echo -e "${GREEN}  EnergiKita — Deployment Info${NC}"
    echo "============================================================"
    echo ""
    echo "Struktur deploy:"
    echo "  backend/"
    echo "  ├── public/"
    echo "  │   ├── index.html    (React SPA)"
    echo "  │   ├── assets/       (CSS, JS bundle)"
    echo "  │   ├── index.php     (Laravel front controller)"
    echo "  │   └── .htaccess     (Apache URL rewrite)"
    echo "  ├── app/"
    echo "  ├── config/"
    echo "  ├── routes/"
    echo "  ├── database/"
    echo "  └── .env              (konfigurasi production)"
    echo ""
    echo "Yang perlu dikonfigurasi di server:"
    echo ""
    echo "  1. Upload folder backend/ ke server"
    echo "  2. Buat database MySQL:"
    echo "     mysql -u root -p < database/energikita.sql"
    echo "  3. Jalankan migrasi Laravel:"
    echo "     cd backend && php artisan migrate --force"
    echo "  4. Siapkan akun demo (opsional):"
    echo "     php artisan db:seed"
    echo "  5. Copy .env.example ke .env dan isi nilai production:"
    echo "     cp .env.example .env"
    echo "     php artisan key:generate"
    echo "     nano .env"
    echo "  6. Set permissions:"
    echo "     chmod -R 775 storage bootstrap/cache"
    echo "     chown -R www-data:www-data storage bootstrap/cache"
    echo "  7. Apache: pastikan mod_rewrite aktif"
    echo "     DocumentRoot harus指向 backend/public/"
    echo ""
    echo "Isi .env yang WAJIB diubah:"
    echo "  APP_URL=https://domain-kamu.domainsiasia.co.id"
    echo "  DB_HOST=127.0.0.1"
    echo "  DB_DATABASE=energikita"
    echo "  DB_USERNAME=your_db_user"
    echo "  DB_PASSWORD=your_db_password"
    echo "  MAIL_USERNAME=email@domain-kamu.domainsiasia.co.id"
    echo "  MAIL_PASSWORD=your_smtp_password"
    echo ""
    echo "============================================================"
}

# --------------------------------------------------
# Main
# --------------------------------------------------
case "${1:---full}" in
    --build)  do_build ;;
    --copy)   do_copy ;;
    --full)
        do_build
        do_copy
        do_info
        ;;
    --info)   do_info ;;
    *)
        echo "Usage: $0 [--build|--copy|--full|--info]"
        exit 1
        ;;
esac
