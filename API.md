# Kacırıyosun API endpoints

## Full URL: https://api.kaciriyosun.com/v1

#### ************************************\*\*************************************

## [GET] /profile

### Description:

Kullanici buraya GET istegi atarak giris yapip yapmadigini anlayabilir. Eger giris yapmissa kullaniciya bilgileri basit bir json objesiyle sunulur, eger giris yapmamissa cevap olarak null degeri gelir. (Bu endpoint icin status code her zaman 200 dur)

### Response: 200

```json
{
  "_id": "6536a0a985f418de9e8093c2",
  "username": "mirsaiddev",
  "email": "mirsaiddev@gmail.com",
  "email_verified": false,
  "role": "user",
  "img": "",
  "ref_code": "OJDE2IP8",
  "ref_from": "",
  "api_key": "kaciriyosun_XxH1wALMYOMsWu7vZWrQFk04WjIY"
}
```

#### or

```javascript
null;
```

#### ************************************\*\*************************************

## [PUT] /profile

### Description:

Kullanici buraya PUT istegi atarak profil bilgilerindeki yalnizca "username" ve "img" bilgilerini degistirebilir. Username sadece ayda 1 degistirilebilir. "img_base64" propertisi base64 string formatinda olmalidir.

### Request Body:

```json
{
  "username": "mirsaiddev_farkli",
  "img_base64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEU"
}
```

### Response: 200

```json
{
  "_id": "6536a0a985f418de9e8093c2",
  "username": "mirsaiddev_farkli",
  "email": "mirsaiddev@gmail.com",
  "email_verified": false,
  "role": "user",
  "img": "{IMG_URL}",
  "ref_code": "OJDE2IP8",
  "ref_from": "",
  "api_key": "kaciriyosun_XxH1wALMYOMsWu7vZWrQFk04WjIY"
}
```

### Response: 401

```javascript
{
	"success": false,
	"message": "Something went wrong"
}
```

### Response: 422

```javascript
{
	"message": "{HATA_MESAJI}",
	"type": "auth:edit-profile"
}
```

#### ************************************\*\*************************************

## [POST] /signup

### Description:

Kullanici buraya POST istegi atarak sisteme uye olabilir. Ayni zamanda giris yapmis gibi oturum baslatilir ve client tarafina bir cookie gonderilir. Gonderilen cookie degeri basit bir stringden ibarettir ve otomatik olarak clienta yapisir, yalniz client bu cookie degerini goremez ya da client side script ile ulasamaz. Servera atilan her istekle beraber bu cookie stringide otomatik olarak gonderilir boylelikle sunucu kullanicilari takip edebilir.

### Request Body:

```javascript
{
	"username": "", // optional
	"email": "mirsaiddev@gmail.com",
	"password": "123abc3d",
	"password_verification": "123abc3d",
}

```

### Response: 200

```javascript
{
	"_id": "6536a0a985f418de9e8093c2",
	"username": "mirsaiddev",
	"email": "mirsaiddev@gmail.com",
	"email_verified": false,
	"role": "user",
	"img": "{IMG_URL}",
	"ref_code": "OJDE2IP8",
	"ref_from": "",
	"api_key": "kaciriyosun_XxH1wALMYOMsWu7vZWrQFk04WjIY"
}
```

### Response: 422

```javascript
{
	"message": "{HATA_MESAJI}",
	"type": "auth:signup"
}
```

#### ************************************\*\*************************************

## [POST] /signin

### Description:

Kullanici buraya POST istegi atarak sisteme giris yapabilir. Oturum baslatilir ve client tarafina bir cookie gonderilir.

### Request Body:

```javascript
{
	"uid": "mirsaiddev@gmail.com",
	"password": "123abc3d"
}

```

### Response: 200

```javascript
{
	"_id": "6536a0a985f418de9e8093c2",
	"username": "mirsaiddev",
	"email": "mirsaiddev@gmail.com",
	"email_verified": false,
	"role": "user",
	"img": "{IMG_URL}",
	"ref_code": "OJDE2IP8",
	"ref_from": "",
	"api_key": "kaciriyosun_XxH1wALMYOMsWu7vZWrQFk04WjIY"
}
```

### Response: 422

```javascript
{
	"message": "{HATA_MESAJI}",
	"type": "auth:signin"
}
```

#### ************************************\*\*************************************

## [GET] /signout

### Description:

Kullanici buraya GET istegi atarak sistemden cikis yapabilir. Client tarafindaki cookiesi silinir ve sunucudaki oturumu kapanir. Eger kullanici giris yapmamis haldeyken buraya istek atarsa 401 unauthorized alir.

### Response: 200

```javascript
true;
```

### Response: 401

```javascript
{
	"success": false,
	"message": "Something went wrong"
}
```

#### ************************************\*\*************************************

## [GET] /verify-email/:token

### Description:

Kullanici buraya GET istegi atarak emailini onaylayabilir. endpointteki token yerine uye oldugumuzda mailimize gonderilen token konmalidir. Email onaylama suresi 24 saattir ve bundan sonra gecersiz olup tekrar email onayi istegi atilmasi gerekir.

### Response: 200

```javascript
{
	"_id": "6536a0a985f418de9e8093c2",
	"username": "mirsaiddev",
	"email": "mirsaiddev@gmail.com",
	"email_verified": true,
	"role": "user",
	"img": "{IMG_URL}",
	"ref_code": "OJDE2IP8",
	"ref_from": "",
	"api_key": "kaciriyosun_XxH1wALMYOMsWu7vZWrQFk04WjIY"
}
```

### Response: 422

```javascript
{
	"message": "{HATA_MESAJI}",
	"type": "auth:verify-email"
}
```

#### ************************************\*\*************************************

## [POST] /change-email

### Description:

Kullanici buraya POST istegi atarak degistirecegi yeni emailine onay linki gonderebilir. Eger uye girisi yapmamissa 401 unauthorized dondurulur.

### Request Body:

```javascript
{
    "email": "mirsaiddev_yeni@gmail.com"
}
```

### Response: 200

```javascript
{
	"_id": "653839abf38cb6210dd7589c",
	"username": "mirsaiddev",
	"email": "mirsaiddev_yeni@gmail.com", // emailimiz degisti
	"email_verified": false, // email_verified false oldu ve onay bekliyor
	"role": "user",
	"img": "",
	"ref_code": "N91UR0YG",
	"ref_from": "",
	"api_key": "kaciriyosun_zPVEZiA1Ou8qE58y2kubwB3xExkm"
}
```

### Response: 401

```javascript
{
	"success": false,
	"message": "Something went wrong"
}
```

### Response: 422

```javascript
{
	"message": "{HATA_MESAJI}",
	"type": "auth:change-email"
}
```

#### ************************************\*\*************************************

## [POST] /change-password

### Description:

Kullanici buraya POST istegi atarak sifresini degistirebilir. Eger kullanici giris yapmamissa 401 unauthorized alir. Eger giris yapmis fakat yanlis sifre gibi hatali bilgi girdiyse 422 alir.

### Request Body:

```javascript
{
	"password": "123abc3d",
	"new_password": "321abc",
	"new_password_verification": "321abc"
}
```

### Response: 200

```javascript
{
	"_id": "653839abf38cb6210dd7589c",
	"username": "mirsaiddev",
	"email": "mirsaiddev_yeni@gmail.com",
	"email_verified": true,
	"role": "user",
	"img": "",
	"ref_code": "N91UR0YG",
	"ref_from": "",
	"api_key": "kaciriyosun_zPVEZiA1Ou8qE58y2kubwB3xExkm"
}
```

### Response: 401

```javascript
{
	"success": false,
	"message": "Something went wrong"
}
```

### Response: 422

```javascript
{
	"message": "{HATA_MESAJI}",
	"type": "auth:change-password"
}
```
