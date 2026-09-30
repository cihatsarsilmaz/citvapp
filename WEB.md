# CITV Slot — web bilgileri

## Gizlilik

CITV Slot hesap, ad veya e-posta istemez. Cüzdan adresi tarayıcının yerel depolamasında saklanır ve bakiye sorgusu sırasında yapılandırılmış bakiye API'sine gönderilir. Adres herkese açık blokzincir verisidir; özel anahtarınızı veya kurtarma ifadenizi bu siteye ya da herhangi bir API'ye girmeyin.

Bakiye uç noktası yalnızca `GET ?wallet=<adres>` isteğiyle ERC-20 bakiyesi okur; spin veya token transferi yapmaz. Sunucu tarafında `CITV_RPC_URL`, `CITV_TOKEN_ADDRESS` ve isteğe bağlı `CITV_TOKEN_DECIMALS` (varsayılan `18`) ortam değişkenlerini ayarlayın. İstemci derlemesinde `VITE_CITV_BALANCE_URL` değerini bu uç noktanın URL'si olarak ayarlayın. Cüzdan adresini kaldırmak için tarayıcıda site verilerini temizleyin.

## Yaş şartı

Bu site yalnızca 18 yaş ve üzerindeki kişiler içindir. Yerel yasalarınız daha yüksek bir yaş sınırı belirliyorsa o sınır geçerlidir. DEMO bakiyesi yenilenmez; LIVE spin, sunucu tarafı spin hizmeti sağlanana kadar kapalıdır.
