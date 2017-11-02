var crypto = require('crypto');
//和java程序进行交互的时候，java那边使用AES 128位填充模式：AES/CBC/PKCS5Padding加密方法，
//在nodejs中采用对应的aes-128-cbc加密方法就能对应上，
//因为有使用向量（iv），所以nodejs中要用createCipheriv方法

/**
 * 加密方法
 * @param key 加密key
 * @param iv       向量
 * @param data     需要加密的数据
 * @returns string
 */
var encrypt = function (key, iv, data) {
    var cipher = crypto.createCipheriv('aes-128-cbc', key, iv);
    var crypted = cipher.update(data, 'utf8', 'binary');
    crypted += cipher.final('binary');
    crypted = new Buffer(crypted, 'binary').toString('base64');
    return crypted;
};

/**
 * 解密方法
 * @param key      解密的key
 * @param iv       向量
 * @param crypted  密文
 * @returns string
 */
var decrypt = function (key, iv, crypted) {
    crypted = new Buffer(crypted, 'base64').toString('binary');
    var decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
    var decoded = decipher.update(crypted, 'binary', 'utf8');
    decoded += decipher.final('utf8');
    return decoded;
};

var key = 'ac1f3z1ed5n8f9h0';
console.log('加密的key:', key.toString('hex'));
var iv = '2389742334324786';
console.log('加密的iv:', iv);
var data = '{"cityname":"长沙","dishname":"辣椒炒肉"}';
console.log("需要加密的数据:", data);
var crypted = encrypt(key, iv, data);
console.log("数据加密后:", crypted);
var dec = decrypt(key, iv, crypted);
console.log("数据解密后:", dec);



