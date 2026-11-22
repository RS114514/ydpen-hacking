#include <stdio.h>
#include <stdlib.h>
#include <fcntl.h>
#include <unistd.h>
#include <string.h>
#include <linux/input.h>
static void ev(int fd, int type, int code, int val){
  struct input_event e; memset(&e,0,sizeof(e));
  e.type=type; e.code=code; e.value=val;
  write(fd,&e,sizeof(e));
}
int main(int argc,char**argv){
  if(argc<4){fprintf(stderr,"usage: %s dev x y\n",argv[0]);return 1;}
  int fd=open(argv[1],O_WRONLY); if(fd<0){perror("open");return 1;}
  int x=atoi(argv[2]), y=atoi(argv[3]);
  ev(fd,EV_ABS,ABS_MT_SLOT,0);
  ev(fd,EV_ABS,ABS_MT_TRACKING_ID,1);
  ev(fd,EV_ABS,ABS_MT_POSITION_X,x);
  ev(fd,EV_ABS,ABS_MT_POSITION_Y,y);
  ev(fd,EV_KEY,BTN_TOUCH,1);
  ev(fd,EV_SYN,SYN_REPORT,0);
  usleep(80000);
  ev(fd,EV_ABS,ABS_MT_TRACKING_ID,-1);
  ev(fd,EV_KEY,BTN_TOUCH,0);
  ev(fd,EV_SYN,SYN_REPORT,0);
  close(fd);
  printf("tapped mt %d,%d\n",x,y);
  return 0;
}
