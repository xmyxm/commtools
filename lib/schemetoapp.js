/**
 * 打开App ， 如果没有安装，跳转到下载页面或者错误提示
 * @原理
 * 点击打开时，尝试跳转到指定的app scheme， 系统会打开相应的app，当前的浏览器进入休眠状态
 * setTimeout一段处理逻辑，当从app跳转回网页的时候，setTimeout会立即执行，利用时间差的长短判断是否打开了APP
 *
 * ！！注意
 * 不同的浏览器的休眠不一样，有的设备或者webview ，可能根本就不休眠，这样会导致打开app的时候也直接跳转到了指定的下载页面或者执行了没有打开app的逻辑
 * 不是所有的浏览器都能完美支持
 * 这里只能最大限度的规避错误
 * */
//ua detect
var ua = navigator.userAgent;
var isAndroid = ua.match(/android/i);
var isIos = ua.match(/(ipad|iphone|ipod).*os\s([\d_]+)/i);
/**
 * @method
 * @param {String} scheme ,APP scheme
 * @param {Object} options
 * {
 *      androidDownloadUrl {String} ,如果有此URL，安卓设备会跳转到此url,
 *      iosDownloadUrl {String}     ,如果有此URL，ios设备会跳转到此url,
 *      downloadUrl {String}        ,如果有此URL，并且没有上述URL，会跳转到此URL，
 *      onFail {Function}           回调函数：唤起动作附带的行为
 * }
 * */
var open = function (scheme, options) {
    //open download page
    var download = function () {
        if (options) {
            var downloadUrl = (isAndroid && options.androidDownloadUrl) ? options.androidDownloadUrl : ((isIos && options.iosDownloadUrl) ? options.iosDownloadUrl : options.downloadUrl);
            if (downloadUrl) {
                location.href = downloadUrl;
            }
        }
    };
    //fail handler
    var fail = function () {
        setTimeout(function () {
            if (options) {
                options.onFail && options.onFail();
                download();
            }
        }, 0);
    };
    var browser = !function (ua) {
        var browser = {};
        browser.isWeChat = (/MicroMessenger/i.test(ua));
        return browser;
    }(ua);
    var iframeOpen = function () {
        /*
         * 安卓利用一个iframe 尝试跳转到app schema
         * */
        var div = document.createElement('div');
        div.style.visibility = 'hidden';
        div.innerHTML = "<iframe src=\"" + scheme + "\" scrolling=\"no\" width=\"1\" height=\"1\"></iframe>";
        document.body.appendChild(div);
    }
    //main logic
    if (isAndroid) {
        if (browser.isWeChat) {
            iframeOpen();
        }  else {
            window.location = scheme;
        }
        fail();
    } else if (isIos) {
        window.location = scheme;
        fail();
    } else {
        //others
        download();
    }
};
module.exports = open;



