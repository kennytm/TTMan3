






























function installBlockingSheet(){
if(!$("bs-sheetcontainer")){
var c=document.createElement("div");
var bo=document.createElement("div");
c.id="bs-sheetcontainer";
bo.id="bs-blackout";
bo.innerHTML="&nbsp;";
document.body.appendChild(bo);
document.body.appendChild(c);}}




function BlockingSheet(title,innerhtml,icon,buttons,color,autodismissduration){
this.title=title;
this.innerHTML=innerhtml;
this.icon=(icon.indexOf(".")==-1)?icon+".png":icon;
this.buttons=buttons;
this.color=getColor(color);
this.height=0;
this.onhide=null;
this.autodismissduration=autodismissduration;

if(autodismissduration)
{this.innerHTML+="<p class=\"not-important\">This message will be automatically dismissed in <span id=\"dismiss-countdown\">"+Math.round(autodismissduration/1000)+"</span> seconds.</p>";}

var darker_color=darker(this.color);
var text_color=getTextColorFromBG(this.color);
var darker_text_color=getTextColorFromBG(darker_color);


this.html=BlockingSheet.HTML
.replace(/#COLOR#/g,this.color)
.replace(/#DARKERCOLOR#/g,darker_color)
.replace(/#TEXTCOLOR#/g,text_color)
.replace(/#DARKERTEXTCOLOR#/g,darker_text_color)
.replace(/#ICON#/g,this.icon)
.replace(/#BUTTONS#/g,BlockingSheet.buttonsToHTML(this.buttons))
.replace(/#TITLE#/g,this.title)
.replace(/#HTML#/g,this.innerHTML);}





BlockingSheet.status="hidden";


BlockingSheet.autodismisstimeout=0;
BlockingSheet.autodismisscountdown=0;


BlockingSheet.prototype.show=function(){var njf1=njen(this,arguments);nj:while(1){switch(njf1.cp){case 0:
if(BlockingSheet.autodismisstimeout){
clearTimeout(BlockingSheet.autodismisstimeout);
BlockingSheet.autodismisstimeout=0;}case 1:



njf1.cp=(BlockingSheet.status=="hiding")?2:3;break;case 2:njf1.pc(4,null,
sleep,[128]);case 4:with(njf1)if((rv4=f.apply(c,a))==NJSUS){return fh;}njf1.cp=1;break;case 3:


if(BlockingSheet.status=="hidden"){
disableForms();}
 else {

njf1._buttons=document.getElementById("bs-buttons").getElementsByTagName("input");
for(njf1._i=njf1._buttons.length-1;njf1._i>=0;--njf1._i)
njf1._buttons[njf1._i].onclick=null;}



njf1._$BS=document.getElementById("bs-sheetcontainer");

njf1._$BS.innerHTML=this.html;
this.height=njf1._$BS.clientHeight;
njf1._$BSI=document.getElementById("bs-sheet");


njf1._buttons=document.getElementById("bs-buttons").getElementsByTagName("input");
for(njf1._i=njf1._buttons.length-1;njf1._i>=0;--njf1._i)
njf1._buttons[njf1._i].onclick=BlockingSheet.ButtonEventListener(this,njf1._i);


BlockingSheet.ResizeEventListener();
window.onresize=BlockingSheet.ResizeEventListener;

njf1._$BO=document.getElementById("bs-blackout");
njf1._THIS=this;

njf1._$BO.style.display="block";


njf1.cp=(BlockingSheet.status=="hidden")?5:6;break;case 5:
BlockingSheet.status="showing";njf1.pc(7,null,
animate,[500,function(t){
njf1._$BO.style.opacity=t*0.75;
njf1._$BO.style.filter="alpha(opacity="+(t*75)+")";
njf1._$BS.style.top=njf1._THIS.height*(1-t)*(t-1)+"px";}]);case 7:with(njf1)if((rv7=f.apply(c,a))==NJSUS){return fh;}

BlockingSheet.status="doneshowing";njf1.cp=6;break;case 6:


if(BlockingSheet.status=="doneshowing")
{BlockingSheet.status="shown";}

if(this.autodismissduration){
BlockingSheet.autodismisstimeout=setTimeout(njf1._buttons[njf1._buttons.length-1].onclick,this.autodismissduration);
BlockingSheet.autodismisscountdown=setTimeout("BlockingSheet.countdown("+Math.round(this.autodismissduration/1000-1)+");",1000);}break nj;}}};



BlockingSheet.prototype.hide=function(){var njf1=njen(this,arguments);nj:while(1){switch(njf1.cp){case 0:
if(BlockingSheet.autodismisstimeout){
clearTimeout(BlockingSheet.autodismisstimeout);
BlockingSheet.autodismisstimeout=0;}

if(BlockingSheet.autodismisscountdown){
clearTimeout(BlockingSheet.autodismisscountdown);}case 1:



njf1.cp=(BlockingSheet.status=="showing")?2:3;break;case 2:njf1.pc(4,null,
sleep,[128]);case 4:with(njf1)if((rv4=f.apply(c,a))==NJSUS){return fh;}njf1.cp=1;break;case 3:


if(BlockingSheet.status!="shown")
{return;}

BlockingSheet.status="hiding";


njf1._buttons=document.getElementById("bs-buttons").getElementsByTagName("input");
for(njf1._i=njf1._buttons.length-1;njf1._i>=0;--njf1._i)
njf1._buttons[njf1._i].onclick=null;

njf1._$BO=document.getElementById("bs-blackout"),njf1._$BS=document.getElementById("bs-sheetcontainer");
njf1._THIS=this;njf1.pc(5,null,


animate,[500,function(t){
njf1._$BO.style.opacity=(1-t)*0.75;
njf1._$BS.style.top=(-njf1._THIS.height*t*t)+"px";}]);case 5:with(njf1)if((rv5=f.apply(c,a))==NJSUS){return fh;}



njf1._$BO.style.display="none";
njf1._$BS.innerHTML="";

enableForms();

BlockingSheet.status="hidden";
window.onresize=null;

njf1.cp=(this.onhide)?6:7;break;case 6:njf1.pc(8,
this,"onhide",[]);case 8:with(njf1)if((rv8=f.apply(c,a))==NJSUS){return fh;}njf1.cp=7;break;case 7:break nj;}}};


BlockingSheet.countdown=function(secsleft){
$("dismiss-countdown").innerHTML=secsleft;
BlockingSheet.autodismisscountdown=setTimeout("BlockingSheet.countdown("+(secsleft-1)+");",1000);};


BlockingSheet.buttonsToHTML=function(btnarr){
var res=new Array(btnarr.length);
for(var i=res.length-1;i>=0;--i){
if(btnarr[i])
{res[i]=BlockingSheet.BUTTON_HTML.replace(/#BTN#/g,btnarr[i][0]);}

 else res[i]="&nbsp; &nbsp; &mdash; &nbsp; &nbsp;<input type=\"hidden\" />";}

return res.join(" ");};


BlockingSheet.ResizeEventListener=function(){
document.getElementById("bs-blackout").style.height=(document.documentElement.clientHeight||document.body.clientHeight)+"px";};


BlockingSheet.ButtonEventListener=function(BSObj,index){
var thatfunction=BSObj.buttons[index][1];
return function(){var njf2=njen(this,arguments);nj:while(1){switch(njf2.cp){case 0:
njf2.cp=(!thatfunction())?1:2;break;case 1:njf2.pc(3,
BSObj,"hide",[]);case 3:with(njf2)if((rv3=f.apply(c,a))==NJSUS){return fh;}njf2.cp=2;break;case 2:break nj;}}};};




BlockingSheet.BUTTON_HTML="<input type=\"button\" id=\"bs-btn-#BTN#\" value=\"#BTN#\" />";
BlockingSheet.HTML=[
"<div id=\"bs-sheet\" style=\"background-color:#COLOR#;color:#TEXTCOLOR#\">",
"<h4 id=\"bs-title\" style=\"background-color:#DARKERCOLOR#;color:#DARKERTEXTCOLOR#\">#TITLE#</h4>",
"  <table id=\"bs-table\">",
"    <tr>",
"      <td id=\"bs-icon\"><img src=\"img/#ICON#\" width=\"64\" height=\"64\" alt=\"#ICON#\" /></td>",
"      <td id=\"bs-content\">#HTML#</td>",
"    </tr>",
"    <tr><td></td><td id=\"bs-buttons\">#BUTTONS#</td></tr>",
"  </table>",
"</div>"]
.join("");

BlockingSheet.forceHide=BlockingSheet.prototype.hide;
