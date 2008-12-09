





























var ProxyCGI=location.protocol=="file:"?"":location.protocol+"//"+location.host+"/~ph_cckac/cgi-bin/proxy.cgi";



var HTTP=location.protocol=="https:"?"https://":"http://";

var XMLHttpObject;

if(window.XMLHttpRequest){
try {
XMLHttpObject=new XMLHttpRequest();}
 catch(e){
XMLHttpObject=false;}}

 else if(window.ActiveXObject){
try {
XMLHttpObject=new ActiveXObject("Msxml2.XMLHTTP");}
 catch(e){
try {
XMLHttpObject=new ActiveXObject("Microsoft.XMLHTTP");}
 catch(e){
XMLHttpObject=false;}}}




if(!XMLHttpObject){
new BlockingSheet
("The <code>XMLHttpRequest</code> object cannot be created.",
"<p>If you are using Internet Explorer, probably you have turned off ActiveX control. Please turn it on.<br />Otherwise, upgrade your browser to the latest version.</p>",
"error",
[],
"#FFCCCC")
.show();}



function GET(url,waitmsg,login,password){var njf1=njen(this,arguments,"url","waitmsg","login","password");nj:while(1){try{switch(njf1.cp){case 0:
if(!njf1._waitmsg)
{njf1._waitmsg="Loading "+njf1._url+"&hellip;";}

njf1._fetched=new EventNotifier();
njf1._mySheet=new BlockingSheet("Loading",njf1._waitmsg,"loading.gif",[],"white");

XMLHttpObject.onreadystatechange=njf1._fetched;

njf1._mySheet.show();


this.opened=false;
this.login=njf1._login;
this.password=njf1._password;
this.url=njf1._url;

if(!ProxyCGI){
try {
netscape.security.PrivilegeManager.enablePrivilege("UniversalBrowserRead");}
 catch(e){}

if(njf1._login){
try {
XMLHttpObject.open("GET",url,true,this.login,this.password);
XMLHttpObject.send(null);
this.opened=true;}
 catch(e){doNothing();}}
 else {
try {
XMLHttpObject.open("GET",url,true);
XMLHttpObject.send(null);
this.opened=true;}
 catch(e){}}}



njf1.cp=(!this.opened)?1:2;break;case 1:njf1.ecp=3;

XMLHttpObject.open("POST",ProxyCGI,true);
XMLHttpObject.setRequestHeader("Content-Type","application/x-www-form-urlencoded; charset=utf-8");
njf1._postcontent="url="+encodeURIComponent(njf1._url);
if(njf1._login)
{njf1._postcontent+="&login="+encodeURIComponent(njf1._login)+"&password="+encodeURIComponent(njf1._password);}
XMLHttpObject.send(njf1._postcontent);njf1.cp=4;break;case 3:njf1.ecp=null;njf1.thr=false;njf1._e = njf1.ex;njf1.pc(5,

njf1._mySheet,"hide",[]);case 5:with(njf1)if((rv5=f.apply(c,a))==NJSUS){return fh;}
new BlockingSheet
("Cannot Perform <code>XMLHttpRequest</code>",
"<p>A request to ["+njf1._url+"] is failed probably because of local security measure.</p><p>Please run this program online.</p><p>Exception caught: "+njf1._e.message+".</p>",
"error",
[],
"#FFCCCC")
.show();
throw(njf1._e);njf1.cp=4;break;case 4:njf1.cp=2;break;case 2:case 6:



njf1.cp=(XMLHttpObject.readyState!=4)?7:8;break;case 7:njf1.pc(9,
njf1._fetched,"wait",[]);case 9:with(njf1)if((rv9=f.apply(c,a))==NJSUS){return fh;}njf1.cp=6;break;case 8:


XMLHttpObject.onreadystatechange=null;

njf1._mySheet.hide();

njf1._respcontent="";
njf1._respsttext="";

try {
return {
content:XMLHttpObject.responseText,
status:XMLHttpObject.status,
message:XMLHttpObject.statusText,
url:this.url,
exception:null};}

 catch(e){
return {
content:"",
status:XMLHttpObject.status,
message:"",
url:this.url,
exception:e};}break nj;}}catch(ex){njf1.doex(ex)}}}




function authenticate(url,reason){var njf1=njen(this,arguments,"url","reason");nj:while(1){switch(njf1.cp){case 0:
if(!njf1._reason){njf1._reason="";}
if(!njf1._url){njf1._url="http://";}

njf1._insecure=false;

if(ProxyCGI&&location.protocol=="http:"||njf1._url.substr(0,5)=="http:")
{njf1._insecure=true;}

njf1._html="<p>Authentication is required to access "+njf1._url+" ("+njf1._reason+").</p><div><table id=\"auth-table\"><tr><th><label for=\"auth-username\">Username:</label></th><td><input type=\"text\" id=\"auth-username\"></td></tr><tr><th><label for=\"auth-password\">Password:</label></th><td><input type=\"password\" id=\"auth-password\" /></td></tr></table></div>";
if(njf1._insecure)
{njf1._html+="<p><em>Warning: Your connection is insecure. Your password could be eavesdropped!</em></p>";}

njf1._login="",njf1._password="";

njf1._mySheet=new BlockingSheet
("Authentication required",
njf1._html,
"password",
[["Cancel",doNothing],null,["Login",function(){
njf1._login=document.getElementById("auth-username").value;
njf1._password=document.getElementById("auth-password").value;
return !njf1._login;}]],

"#CCCCFF");


njf1._hided=new EventNotifier();
njf1._mySheet.onhide=njf1._hided;njf1.pc(1,

njf1._mySheet,"show",[]);case 1:with(njf1)if((rv1=f.apply(c,a))==NJSUS){return fh;}njf1.pc(2,
njf1._hided,"wait",[]);case 2:with(njf1)if((rv2=f.apply(c,a))==NJSUS){return fh;}

return {login:njf1._login,password:njf1._password};break nj;}}}



function httpError(response,altmsg,dismissable){
new BlockingSheet
("HTTP Error #"+response.status,
altmsg||"<p>HTTP Error #"+response.status+" ("+response.message+") encountered while loading ["+response.url+"].</p>",
dismissable?"warning":"error",
dismissable?[["Dismiss",doNothing]]:[],
dismissable?"#FFFFCC":"#FFCCCC",
dismissable)
.show();}
