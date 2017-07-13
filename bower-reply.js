//以百度贴吧为例，批量发送add请求回复帖子

var sendData = (function init(){
	var xhr = null;
	if(window.XMLHttpRequest){
		xhr = new XMLHttpRequest();
	}else if (window.ActiveXObject){
		xhr = new ActiveXObject("Microsoft.XMLHTTP");
	}
	if (xhr!=null)
	{
		xhr.onreadystatechange=state_Change;
	}else{
  		printMsg("浏览器不存在 XMLHTTP.");
  	}

	//创建具体的响应函数state_Change
	function state_Change(){
	if(xhr.readyState == 4){
	  	if (xhr.status == 200){
	    	printMsg('时间: '+ Date.now() + " 服务器端返回成功:" + xhr.responseText, true);
	    }else{
	    	printMsg("服务器端返回出错");
	    }
	  }
	}

	function printMsg(info,isok){
		if(isok){
			console.log("%c" + info,"color:green;font-weight:bold;");	
		}else{
			console.log("%c" + info,"color:red;font-weight:bold;");
		}
	}

	function paramsTostr(data){
	    var arr = [];
	    for(var i in data){
	        arr.push(encodeURIComponent(i) + "=" + encodeURIComponent(data[i]));
	    }
	    return arr.join("&");
	}

	function mysend(method,url,data){
		if(data)data = paramsTostr(data); 
		if(method.toUpperCase() == "POST"){
			xhr.open(method || "GET", url, true);//指定请求，这里要访问在/example/xdom路径下的note.xml文件，true代表的使用的是异步请求
			xhr.send(data);
		}else{//GET
			if(url.indexOf("?") > 0){
				url += "&";
			}else{
				url += "?";
			}
			url += data;
			xhr.send(null);
		}
	}
	return mysend;
})();

var data = {ie:'utf-8',kw:'微单',fid:3072337,tid:5218603607,vcode_md5:'',floor_num:3,rich_text:1,tbs:'b51dab5244765dc01499858271',content:'百度测试,时间:' + Date.now(),basilisk:1,files:[],sign_id:51694246,mouse_pwd:'105,104,105,112,109,105,107,106,85,109,112,108,112,109,112,108,112,109,112,108,112,109,112,108,112,109,112,108,85,107,100,110,106,106,85,109,104,104,108,112,101,108,108,14998583608920',mouse_pwd_t:1499858360892,mouse_pwd_isclick:0,__type__:'reply',_BSK:'JVwPUWcLBF83AFZzQyBEElBHMSUvQFkVSn9FHGUEcmloCGVXB3p9UVdHbHVeD0wcJ0srXRE+GDMxLRURLF9DA2xVSH86IhdEAxEgdzlKEVJjbRoEaRc2Y3MKcAlSJTcYWREwZkYXCAsoWzZYFyNTGD8yF1MvVgYHZwIBfVtuOGUmK2d7eExEFQRtE1QwUGpyNAFyVRN7dExCA2hmVQEIGXsKZRYzMVsOMAoED2cdBlt0Vwl9RHs0FVhVMTUpAEcFG34mA3cHJGVgVDENBntwSUIFaDMHHRtdcBFnAUZiD3Z7TFNGcnUGB2cbAH1bbEQAW1B1YmsUWRVSfEUcZ08ufRJ+ckMROndfTxMpJRFIBksnGX0OXmIIdmlOVFJ0HQZccVcJfRI4GUBGCDUyNAkUW1s/EwomWig2OEI9Q0M7KxAFR3EnFkREHWVaOkULNUszHxAIDiRFTUQrM0E+DClaUwsJJjI2ZBteUywTTypbACIwXTVDQSw1CBBAKR4AQU8qKEQzVh8zU2s9Hw8AIF1tTykQcD4NIBRRCQxpNDtVAUJMKCJQIFsyI31CNQNWKDcYMEU4ORBeBg4sXBxbEyBNMzsaMhc8XUEHKBRHPAkBE1QDBmk6NVMQY1FhCkkzUAQpfUI1HFozISkaHy8yF0RQDAtRc1MbJGsiMhsCFyxeSgcjHF07TSsTRCcGMTQyQBF0bR41UylQNXJ9EjReEXNmMyB/EXVID19YaxJ9eREqUSsyH05WawEEAwgUUDYPOBlDAlxlHjRREFseAAZFZXoVcAkQYV9seHYiRRp9FhRdRgweTT1/FyQXcm1JT1BzEQxgDSF+E01sGlkBAmUQP0YeWBdtJE43Wis1fgVpQQNnd01CAnNmVRgKOihOPkYXfw10aVBSVWcdBlx0Vwl9Lxk6fEhLZyVrB08VWDgJRTFcKT5xQjEBVyYpVVwTJnc/Q0sdIF46FB0/XCIDXhxBaRNXGmdPE2ZRfFoSGVVnbXoUQQMOYUVHcRd8cDdRPBxWZWYeRBFndxBfXwxlCj4HXGoYIT8SEgZpE1MYZ08TOQAgBVVGRSRmeB9VBgp5VwpnVHRyaxBoXQY0'};

for(var x=0;x< 100;x++){
	setTimeout(function(){sendData('POST',location.origin + '/f/commit/post/add',data);},100 * x);
	//请求发送时间小于100 会直接被chrome canceled 掉。
	//setTimeout(function(){sendData('POST',location.origin + '/f/commit/post/add',data);},Math.ceil(Math.random()*(100-1)+1));
}








