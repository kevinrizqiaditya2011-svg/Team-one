<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Verifikasi Email — EnergiKita</title>
</head>
<body style="margin:0;padding:0;background:#F7F9FC;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7F9FC;padding:32px 12px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:18px;border:1px solid #e2e8f0;overflow:hidden;">
                    <tr>
                        <td style="background:linear-gradient(90deg,#2456E6,#22D3EE);height:6px;font-size:0;">&nbsp;</td>
                    </tr>
                    <tr>
                        <td style="padding:28px 28px 8px;">
                            <h1 style="margin:0 0 6px;font-size:20px;color:#0D1B33;">Halo, {{ $name }}!</h1>
                            <p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:#475569;">
                                Terima kasih sudah mendaftar di <strong>EnergiKita</strong>. Satu langkah lagi:
                                konfirmasi alamat emailmu agar akun aktif dan aman.
                            </p>
                            <p style="margin:0 0 22px;font-size:14px;line-height:1.6;color:#475569;">
                                Klik tombol di bawah untuk memverifikasi emailmu:
                            </p>
                            <p style="margin:0 0 24px;text-align:center;">
                                <a href="{{ $verifyUrl }}" style="display:inline-block;background:linear-gradient(90deg,#2456E6,#0891b2);color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;padding:12px 28px;border-radius:999px;">
                                    Verifikasi Email
                                </a>
                            </p>
                            <p style="margin:0 0 14px;font-size:12px;line-height:1.6;color:#94a3b8;">
                                Jika tombol tidak berfungsi, salin tautan berikut ke browser:
                            </p>
                            <p style="margin:0 0 22px;font-size:11px;line-height:1.6;color:#64748b;word-break:break-all;background:#f1f5f9;border-radius:8px;padding:10px 12px;">
                                {{ $verifyUrl }}
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:0 28px 26px;">
                            <p style="margin:0;font-size:11px;color:#94a3b8;">
                                © {{ date('Y') }} EnergiKita · Dibuat untuk masa depan yang lebih hemat.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
