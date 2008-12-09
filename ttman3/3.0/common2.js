



























function animate(time,functor){var njf1=njen(this,arguments,"time","functor");nj:while(1){switch(njf1.cp){case 0:
njf1._d=new Date();case 1:
njf1.cp=(true)?2:3;break;case 2:
njf1._dt=new Date()-njf1._d;
if(njf1._dt>=njf1._time){
njf1._functor(1);
return;}

njf1._functor(njf1._dt/njf1._time);njf1.pc(4,null,
sleep,[45]);case 4:with(njf1)if((rv4=f.apply(c,a))==NJSUS){return fh;}njf1.cp=1;break;case 3:break nj;}}}
