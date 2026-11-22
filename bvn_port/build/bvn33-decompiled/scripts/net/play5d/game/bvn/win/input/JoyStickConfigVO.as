package net.play5d.game.bvn.win.input
{
   import net.play5d.kyo.utils.KyoUtils;
   
   public class JoyStickConfigVO
   {
      
      public var deviceId:String;
      
      public var deviceIsSet:Boolean = false;
      
      public var up2:JoyStickSetVO = new JoyStickSetVO(1,0.5);
      
      public var down2:JoyStickSetVO = new JoyStickSetVO(1,-0.5);
      
      public var left2:JoyStickSetVO = new JoyStickSetVO(0,-0.5);
      
      public var right2:JoyStickSetVO = new JoyStickSetVO(0,0.5);
      
      public var up:JoyStickSetVO = new JoyStickSetVO(16,1);
      
      public var down:JoyStickSetVO = new JoyStickSetVO(17,1);
      
      public var left:JoyStickSetVO = new JoyStickSetVO(18,1);
      
      public var right:JoyStickSetVO = new JoyStickSetVO(19,1);
      
      public var attack:JoyStickSetVO = new JoyStickSetVO(6,1);
      
      public var jump:JoyStickSetVO = new JoyStickSetVO(4,1);
      
      public var dash:JoyStickSetVO = new JoyStickSetVO(5,1);
      
      public var skill:JoyStickSetVO = new JoyStickSetVO(7,1);
      
      public var superSkill:JoyStickSetVO = new JoyStickSetVO(9,1);
      
      public var special:JoyStickSetVO = new JoyStickSetVO(8,1);
      
      public var waikai:JoyStickSetVO = new JoyStickSetVO(10,1);
      
      public var back:JoyStickSetVO = new JoyStickSetVO(12,1);
      
      public var select:JoyStickSetVO = new JoyStickSetVO(13,1);
      
      public function JoyStickConfigVO()
      {
         super();
      }
      
      public function readObj(param1:Object) : void
      {
         var _loc2_:Object = null;
         for(var _loc3_:String in param1)
         {
            _loc2_ = param1[_loc3_];
            if(this.hasOwnProperty(_loc3_))
            {
               if(this[_loc3_] is JoyStickSetVO)
               {
                  (this[_loc3_] as JoyStickSetVO).readObj(_loc2_);
               }
               else
               {
                  this[_loc3_] = _loc2_;
               }
            }
         }
      }
      
      public function toObj() : Object
      {
         var _loc1_:* = undefined;
         var _loc3_:Array = KyoUtils.getItemVaribles(this);
         var _loc2_:Object = {};
         for each(var _loc4_:String in _loc3_)
         {
            _loc1_ = this[_loc4_];
            if(_loc1_ is JoyStickSetVO)
            {
               _loc2_[_loc4_] = (this[_loc4_] as JoyStickSetVO).toObj();
            }
            else
            {
               _loc2_[_loc4_] = this[_loc4_];
            }
         }
         return KyoUtils.itemToObject(this);
      }
   }
}

