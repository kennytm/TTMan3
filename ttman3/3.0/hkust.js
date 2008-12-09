

































var lifts={};


function initLifts(){var njf1=njen(this,arguments);nj:while(1){switch(njf1.cp){case 0:
njf1._result;njf1.pc(1,null,
GET,["http://www.ust.hk/cgi-bin/itsc/roomlift/find.pl","Accessing Lift Selection Advisor for lift information&hellip;<br />[http://www.ust.hk/cgi-bin/itsc/roomlift/find.pl]"]);case 1:with(njf1)if((rv1=f.apply(c,a))==NJSUS){return fh;}njf1._result=njf1.rv1;
if(njf1._result.status==200){
njf1._re=/<tr>\n<td>\n([A-Z\d]+)<\/td>\n<td>\n&nbsp;&nbsp;&nbsp;&nbsp;\n([-,\d]+)<\/td>\n<\/tr>/g;
njf1._m;

while((njf1._m=njf1._re.exec(njf1._result.content)))
lifts[njf1._m[1]]=njf1._m[2];}

 else httpError(njf1._result);break nj;}}}



function getLift(ven){
if(lifts[ven])
{return ven+" ("+lifts[ven]+")";}

 else return ven;}






function STimeInterval(day,start,end,iscourse,code,ssid,ven){
TimeInterval.call(this,day,start,end);
this.isCourse=iscourse;
this.code=code;
this.ssid=ssid;
this.venue=ven;}



STimeInterval.starttime=[];
STimeInterval.endtime=[];
for(var i=7;i<=22;++i){
var _hour=pad(i,2)+":";
STimeInterval.starttime.push(_hour+"00",_hour+"30");
STimeInterval.endtime.push(_hour+"20",_hour+"50");}

STimeInterval.reverseStarttime=STimeInterval.starttime.reverseLookup();
STimeInterval.reverseEndtime=STimeInterval.endtime.reverseLookup();


STimeInterval.timeIndexType=[];
for(var i=0;i<STimeInterval.starttime.length;++i){
if(i<STimeInterval.reverseStarttime["09:00"])
{STimeInterval.timeIndexType.push(-1);}
 else if(i>=STimeInterval.reverseStarttime["19:00"])
{STimeInterval.timeIndexType.push(1);}

 else STimeInterval.timeIndexType.push(0);}


STimeInterval.prototype=new TimeInterval();

STimeInterval.prototype.create=function(day,start,end){
return new STimeInterval(day,start,end,this.isCourse,this.code,this.ssid,this.venue);};


STimeInterval.prototype.toString=function(no_arg){
return TimeInterval.week[this.day]+" "+STimeInterval.starttime[this.start]+"-"+STimeInterval.endtime[this.end]+
(no_arg?"":" ("+(this.isCourse?this.code+" "+this.ssid:this.code)+")");};


STimeInterval.prototype.toHTML=function(){
if(this.isCourse)
{return "<strong>"+this.code+"</strong> <em>"+this.ssid+"</em><br /><small>"+get_lift(this.venue)+"</small>";}

 else return "<strong>"+this.code+"</strong>";};


STimeInterval.prototype.clone=function(){
return new STimeInterval(this.day,this.start,this.end,this.isCourse,this.code,this.ssid,this.venue);};





function analyzeSchedule(dayrange,timerange,iscourse,code,ssid,ven){
if(dayrange=="TBA"||timerange=="TBA")
{return [];}

var res=[];
var daysplit=dayrange.split(/,/);
var timesplit=timerange.split(/-/);

for(var i=0;i<daysplit.length;++i){
res.push




(new STimeInterval(TimeInterval.reverseWeek[daysplit[i]],STimeInterval.reverseStarttime[timesplit[0]],STimeInterval.reverseEndtime[timesplit[1]],iscourse,code,ssid,ven));}


return res;}






function SQuota(quota,enroll,rsvd,vac){
this.quota=quota;
this.enroll=enroll;
this.reserved=rsvd;
this.vacancy=vac;

this.clone=function(){
return new SQuota(this.quota,this.enroll,this.reserved,this.vacancy);};}



function SQuotas(grp,quota,enroll,rsvd,vac,wait){
this.waitlist=wait;
this.groups={};
this.totalQuota=0;

if(grp&&grp!="Total"&&grp.substr(0,4)!="   -"){
this.groups[grp]=new SQuota(quota,enroll,rsvd,vac);
this.totalQuota+=quota;}}



SQuotas.prototype.add=function(grp,quota,enroll,rsvd,vac){
if(grp&&grp!="Total"&&grp.substr(0,4)!="   -"&&!this.groups[grp]){
this.groups[grp]=new SQuota(quota,enroll,rsvd,vac);
this.totalQuota+=quota;}};



SQuotas.prototype.clone=function(){
var q=new SQuotas("",0,0,0,0,this.waitlist);
for(var i in this.groups)
q.groups[i]=this.groups[i].clone();
q.totalQuota=this.totalQuota;
return q;};


SQuotas.prototype.toHTML=function(){
var grps=[],quotas=[],enrolls=[],reserves=[],vacancies=[];

for(var i in this.groups){
var quota=this.groups[i];

grps.push(i);
quotas.push(quota.quota);
enrolls.push(quota.enroll);
reserves.push(quota.reserved);
vacancies.push



(10*quota.vacancy<quota.quota?"<span title=\""+Math.round(100*quota.vacancy/quota.quota)+"% free space left!\" class=\"not_enough_freespace\">"+quota.vacancy+"&nbsp;&nbsp;</span>":quota.vacancy);}


return "<td>"+grps.join("<br />")+"</td><td>"+quotas.join("<br />")+"</td><td>"+
enrolls.join("<br />")+"</td><td>"+reserves.join("<br />")+"</td><td>"+vacancies.join("<br />")+
"</td><td>"+
(10*this.waitlist>this.totalQuota?
"<span title=\"Waitlist "+Math.round(100*this.waitlist/this.totalQuota)+"% overloaded!\" class=\"too_much_waitlist\">"+this.waitlist+"&nbsp;&nbsp;</span>":
this.waitlist)
+
"</td>";};





function SSubsection(code,ssid,group,quota,enroll,resv,vac,wait,dayrange,timerange,ven,instr){
this.code=code;

Subsection.call(this,ssid);



this.quotas=new SQuotas(group,quota,enroll,resv,vac,wait);
this.instructor=instr;

this.remarks="";

this.add(analyzeSchedule(dayrange,timerange,true,this.code,ssid,ven));}


SSubsection.prototype=new Subsection();

SSubsection.isMatch=function(ssid1,ssid2){
return ssid1.replace(/[A-Z]$/i,"")==ssid2.replace(/[A-Z]$/i,"");};





function SSection(sid){
Section.call(this,sid);}


SSection.prototype=new Section();















function SVector(d){
var a=d.replace(/[^-:0-9.]/g,"").split(/[-:]/);
this.lectures=a[0]-0;
this.tutorials=a[1]-0;
this.labs=a[2]-0;
this.credits=a[3]-0;}


SVector.prototype.toString=function(){
return "["+this.lectures+"-"+this.tutorials+"-"+this.labs+":"+this.credits+"]";};


SVector.prototype.clone=function(){
var v=new Vector("");
v.lectures=this.lectures;
v.tutorials=this.tutorials;
v.labs=this.labs;
v.credits=this.credits;
return v;};





function SCourse(courseTitle){
this.vector=new SVector(courseTitle[2]);

Course.call(this,courseTitle[0],this.vector.credits);

this.title=courseTitle[1];

this.matchingRules=0;
if(courseTitle.length>3&&courseTitle[3].indexOf("matching")!=-1){
if(courseTitle[3].indexOf("lecture")!=-1)
{this.matchingRules|=1;}
if(courseTitle[3].indexOf("tutorial")!=-1)
{this.matchingRules|=2;}
if(courseTitle[3].indexOf("laboratory")!=-1)
{this.matchingRules|=4;}}


this.additionalWaitlists={L:0,T:0,LA:0,"**":0};

this.subsections={};
this.description="";}


SCourse.prototype=new Course();

SCourse.prototype.computeSections=function(){

var lectures={},tutorials={},laboratories={},others={};

for(var ssid in this.subsections){
if(ssid.substr(0,2)=="LA")
{laboratories[ssid]=true;}
 else if(ssid.charAt(0)=="L")
{lectures[ssid]=true;}
 else if(ssid.charAt(0)=="T")
{tutorials[ssid]=true;}

 else others[ssid]=true;}


var l_sects={},lt_sects={},ltla_sects={};


for(var ssid in lectures){
l_sects[ssid]={L:ssid,T:"",LA:"","**":""};}



if(isEmpty(l_sects)){
for(var ssid in tutorials)
lt_sects["`"+ssid]={L:"",T:ssid,LA:"","**":""};}
 else {

if(!isEmpty(tutorials)){


for(var lec_ssid in l_sects){
var sect2=l_sects[lec_ssid];
for(var ssid in tutorials)
if((3&~this.matchingRules)||SSubsection.isMatch(ssid,sect2.L))
{lt_sects[lec_ssid+"`"+ssid]={L:sect2.L,T:ssid,LA:"","**":""};}}}




 else for(var lec_ssid in l_sects)
lt_sects[lec_ssid+"`"]=l_sects[lec_ssid];}



if(isEmpty(lt_sects)){
for(var ssid in laboratories)
ltla_sects["``"+ssid]={L:"",T:"",LA:ssid,"**":""};}
 else {

if(!isEmpty(laboratories)){

for(var tut_sid in lt_sects){
sect2=lt_sects[tut_sid];
for(var ssid in laboratories){
if(((5&~this.matchingRules)||SSubsection.isMatch(ssid,sect2.L))&&((6&~this.matchingRules)||SSubsection.isMatch(ssid,sect2.T))){
ltla_sects[tut_sid+"`"+ssid]={L:sect2.L,T:sect2.T,LA:ssid,"**":""};}}}}





 else for(var tut_sid in lt_sects)
ltla_sects[tut_sid+"`"]=lt_sects[tut_sid];}



for(var ssid in others)
ltla_sects[ssid]={L:"",T:"",LA:"","**":ssid};


for(var sid in ltla_sects){
var sect=new SSection(sid);
var sect2=ltla_sects[sid];
if(sect2.L)
{sect.add(this.subsections[sect2.L]);}
if(sect2.T)
{sect.add(this.subsections[sect2.T]);}
if(sect2.LA)
{sect.add(this.subsections[sect2.LA]);}
if(sect2["**"])
{sect.add(this.subsections[sect2["**"]]);}

this.add(sect);}};



SCourse.prototype.clone=function(){
var c=new SCourse(this.code);



for(var sid in this.sections){
c.sections[sid]=this.sections[sid].clone();
c.sections[sid].course=c;}

for(var sid in this.equivalents){
c.equivalents[sid]=[];
for(var i=this.equivalents[sid].length-1;i>=0;--i){
c.equivalents[sid].push(this.equivalents[sid].clone());
c.equivalents[sid][c.equivalents[sid].length-1].course=c;}}




c.title=this.title;
c.matchingRules=this.matchingRules;
c.descriptions=this.descriptions;

for(var ssid in this.subsections[type]){
c.subsections[ssid]=this.subsections[ssid].clone();
c.subsections[ssid].course=c;}


return c;};





function SDepartment(dept_code){
this.lastUpdate=new Date();
this.courses={};
this.coursesCount=0;
this.deptCode=dept_code;}


var departments={};




function getDepartment(refCourseNet,dept_code,$TTA){var njf1=njen(this,arguments,"refCourseNet","dept_code","$TTA");nj:while(1){switch(njf1.cp){case 0:

njf1._dept_code=njf1._dept_code.toLowerCase();

njf1._url=HTTP+"www.ab.ust.hk/wcr/intf/out/class/cr_class_"+njf1._dept_code+".htm";njf1.pc(1,
njf1._dept_code,"toUpperCase",[]);case 1:with(njf1)if((rv1=f.apply(c,a))==NJSUS){return fh;}njf1.pc(2,null,GET,[njf1._url,"<p>Querying course information from "+njf1.rv1+" department.</p><p>Waiting for ["+njf1._url+"]</p>"]);case 2:with(njf1)if((rv2=f.apply(c,a))==NJSUS){return fh;}njf1._data=njf1.rv2;

njf1.cp=(njf1._data.status!=200)?3:4;break;case 3:njf1.pc(5,
BlockingSheet,"forceHide",[]);case 5:with(njf1)if((rv5=f.apply(c,a))==NJSUS){return fh;}
if(njf1._data.status==404){
new BlockingSheet
("No Such Department",
"<p>The department "+njf1._dept_code.toUpperCase()+" does not exist.</p>",
"notfound",
[["OK",doNothing]],
"#FFFFCC",
5000)
.show();}
 else if(njf1._data.status==0){








httpError(njf1._data,"<p>The A&amp;B Server [www.ab.ust.hk] is probably under daily maintenence, scheduled in 3&ndash;4am.</p>",8000);}

return;njf1.cp=4;break;case 4:


getDepartment2(njf1._data,njf1._refCourseNet,njf1._dept_code,njf1._$TTA);

njf1._url="http://www.ab.ust.hk/wcr/intf/out/class/cr_cour_"+njf1._dept_code+".htm";njf1.pc(6,
njf1._dept_code,"toUpperCase",[]);case 6:with(njf1)if((rv6=f.apply(c,a))==NJSUS){return fh;}njf1.pc(7,null,GET,[njf1._url,"<p>Querying course description from "+njf1.rv6+" department.</p><p>Waiting for ["+njf1._url+"]</p>"]);case 7:with(njf1)if((rv7=f.apply(c,a))==NJSUS){return fh;}njf1._data=njf1.rv7;

getDepartment3(njf1._data,njf1._refCourseNet,njf1._dept_code,njf1._$TTA);

BlockingSheet.forceHide();break nj;}}}




function getDepartment2(data,refCourseNet,dept_code,$TTA){
var cleaned=data.content;



cleaned=cleaned.replace(/<(?:script|style)[^\x00]+?<\/(?:script|style)>/gi,"");

cleaned=cleaned.replace(/<\/?(?:font|img|strong|a|form|html|head|title|body|hr|div|center)[^>]*>/gi,"");

cleaned=cleaned.replace(/<![^>]+>/gi,"");
cleaned=cleaned.replace(/ (?:v?align|class)=[^\s>]+/gi,"");
cleaned=cleaned.replace(/ nowrap/gi,"");
cleaned=cleaned.replace(/ (?:row|col)span="1"/gi,"");
cleaned=cleaned.replace(/<table[^>]+/gi,"<table");
cleaned=cleaned.replace(/(?:&nbsp;\s+)+/gi,"`");
cleaned=cleaned.replace(/\s{2,}/g," ");
cleaned=cleaned.replace(/(`|>)\s/g,"$1");
cleaned=cleaned.replace(/\s(`|<)/g,"$1");
cleaned=cleaned.replace(/&nbsp;/gi,"");
cleaned=cleaned.replace(/<table><tr><td colspan="11">TBA: To be arranged<br><\/td><\/tr><\/table>/i,"");
cleaned=cleaned.replace(/ Class Quota \/ Schedule/i,"");
cleaned=cleaned.replace(/<table><tr><td><table>/i,"<table>");
cleaned=cleaned.replace(/<\/table><\/td><\/tr><\/table>/i,"</table>");
cleaned=cleaned.replace(/<br[^>]*>/gi,"<br />\n\n");

if(cleaned.indexOf("<table")==-1){
new BlockingSheet
("HTTP Error #"+parseInt(cleaned,10),
"<p>Server returned the error message ["+cleaned+"].</p>",
"error",
[],
"#FFCCCC")
.show();
return;}



$TTA.innerHTML=cleaned;

var mainTable=$TTA.childNodes[1];


var dept=new SDepartment(dept_code.toUpperCase());
dept.lastUpdate=new Date(getText($TTA.firstChild.getElementsByTagName("td")[0]).match(/\d+-\w+-\d+\s\d+:\d+/)[0].replace(/-/g," "));


if(getText(mainTable.rows[0].cells[0])!="No matched class found."){
var rowCount=mainTable.rows.length;


var theCourse;
var theSubsection;


var theCourseIsDirty=false;
var theSubsectionIsDirty=false;


var ssSSID,ssGroup,ssQuota,ssEnroll,ssResv,ssVacancy;
var ssWaitlist,ssDays,ssTime,ssVenue,ssInstr;

for(var row=2;row<rowCount;++row){
var thisRow=mainTable.rows[row];

switch(thisRow.cells.length){

case 1:{
if(theSubsectionIsDirty){
theCourse.subsections[theSubsection.ssid]=theSubsection;}
if(theCourseIsDirty){
theCourse.computeSections();
dept.courses[theCourse.code]=theCourse;
refCourseNet.add(theCourse);
++dept.coursesCount;}


theCourse=new SCourse(getText(thisRow.cells[0]).safeSplit(/`/));

theCourseIsDirty=true;
theSubsectionIsDirty=false;

break;}


case 12:{

if(!theCourseIsDirty)
{throw("Error: The course is not dirty! (hkust.njs)");}


if(theSubsectionIsDirty){
theCourse.subsections[theSubsection.ssid]=theSubsection;}


ssSSID=getText(thisRow.cells[0]);
if(ssSSID!="**")
{ssSSID+=getText(thisRow.cells[1]);}

 else ssSSID=getText(thisRow.cells[1]);



ssGroup=getText(thisRow.cells[2]);
ssQuota=getText(thisRow.cells[3])>>>0;
ssEnroll=getText(thisRow.cells[4])>>>0;
ssResv=getText(thisRow.cells[5])>>>0;
ssVacancy=getText(thisRow.cells[6])>>>0;
ssWaitlist=getText(thisRow.cells[7])>>>0;
ssDays=getText(thisRow.cells[8]);
ssTime=getText(thisRow.cells[9]);
ssVenue=getText(thisRow.cells[10]).replace(/\s+\([-\d]+\)/,"");
ssInstr=thisRow.cells[11].innerHTML;

theSubsection=new SSubsection(theCourse.code,ssSSID,ssGroup,
ssQuota,ssEnroll,ssResv,ssVacancy,ssWaitlist,
ssDays,ssTime,ssVenue,ssInstr);
theSubsectionIsDirty=true;

break;}


case 10:{
if(!theCourseIsDirty)
{throw("Error: The course is not dirty! (hkust.njs)");}
 else if(!theSubsectionIsDirty)
{throw("Error: The subsection is not dirty! (hkust.njs)");}

ssGroup=getText(thisRow.cells[2]);
ssQuota=getText(thisRow.cells[3])>>>0;
ssEnroll=getText(thisRow.cells[4])>>>0;
ssResv=getText(thisRow.cells[5])>>>0;
ssVacancy=getText(thisRow.cells[6])>>>0;
ssDays=getText(thisRow.cells[7]);
ssTime=getText(thisRow.cells[8]);
ssVenue=getText(thisRow.cells[9]).replace(/\s+\([-\d]+\)/,"");


if(ssGroup&&ssGroup!="Total"){
theSubsection.quotas.add(ssGroup,ssQuota,ssEnroll,ssResv,ssVacancy);}



if(ssDays){
theSubsection.add

(analyzeSchedule(ssDays,ssTime,true,theCourse.code,theSubsection.ssid,ssVenue));}


break;}


case 5:{
if(!theCourseIsDirty)
{throw("Error: The course is not dirty! (hkust.njs)");}
if(theSubsectionIsDirty)
{theCourse.subsections[theSubsection.ssid]=theSubsection;}

theSubsectionIsDirty=false;

{
var wlType=getText(thisRow.cells[2]);
var wlWait=getText(thisRow.cells[3])>>>0;

if(wlType.indexOf("Lecture")!=-1)
{theCourse.additionalWaitlists.L=wlWait;}
 else if(wlType.indexOf("Tutorial")!=-1)
{theCourse.additionalWaitlists.T=wlWait;}
 else if(wlType.indexOf("Laboratory")!=-1)
{theCourse.additionalWaitlists.LA=wlWait;}}


break;}


case 9:{
if(!theCourseIsDirty)
{throw("Error: The course is not dirty! (get_department_3,case=9)");}
 else if(!theSubsectionIsDirty)
{throw("Error: The subsection is not dirty! (get_department_3,case=9)");}

theSubsection.remarks=thisRow.lastChild.lastChild.rows[0].cells[1].innerHTML.replace(/&gt;/g,"\n").replace(/<br[^>]*>/g,"").replace(/^\n+/g,"");

break;}


case 3:{
break;}

default:{
throw("Error: Case unhandled! (hkust.njs)");}}}



if(theSubsectionIsDirty)
{theCourse.subsections[theSubsection.ssid]=theSubsection;}
if(theCourseIsDirty){
theCourse.computeSections();
dept.courses[theCourse.code]=theCourse;
refCourseNet.add(theCourse);
++dept.coursesCount;}}



departments[dept.deptCode]=dept;}


function getDepartment3(data,refCourseNet,dept_code,$TTA){
var dept=departments[dept_code.toUpperCase()];



cleaned=data.content;

cleaned=cleaned.replace(/<(script|style|form)[^\x00]+?<\/\1>/gi,"");
cleaned=cleaned.replace(/<\/?(?:font|img|strong|a|link|html|head|title|body|hr|div|center|br)[^>]*>/gi,"");

cleaned=cleaned.replace(/<![^>]+>/gi,"");
cleaned=cleaned.replace(/ (?:v?align|class)=[^\s>]+/gi,"");
cleaned=cleaned.replace(/ nowrap/gi,"");
cleaned=cleaned.replace(/ (?:row|col)span="1"/gi,"");
cleaned=cleaned.replace(/<table[^>]+/gi,"<table");
cleaned=cleaned.replace(/&nbsp;&nbsp;/gi,"`");
cleaned=cleaned.replace(/&nbsp;/gi,"");
cleaned=cleaned.replace(/\s{2,}/g," ");
cleaned=cleaned.replace(/(`|>)\s/g,"$1");
cleaned=cleaned.replace(/\s(`|<)/g,"$1");
cleaned=cleaned.replace(/<td><\/td>/g,"");
cleaned=cleaned.replace(/<table><tr><td><table>/gi,"<table>");
cleaned=cleaned.replace(/<\/table><\/td><\/tr><\/table>/gi,"</table>");

$TTA.innerHTML=cleaned;



var rows=$TTA.getElementsByTagName("table");
var rowCount=rows.length-4;


for(var row=1;row<rowCount;row+=2){
var code=getText(rows[row].rows[0].cells[0]).match(/^[^`]+/)[0];
if(dept.courses[code]){
dept.courses[code].description=getText(rows[row+1].rows[0].cells[0]).replace(/((?:(?:Pre|Co)requisite|Reference|Exclusion|Background)s?:)/g,"<br />&nbsp;• <em>$1</em>");}}}
