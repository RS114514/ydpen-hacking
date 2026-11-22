package net.play5d.game.bvn.fighter.models
{
   import flash.geom.Rectangle;
   import net.play5d.game.bvn.interfaces.IGameSprite;
   import net.play5d.kyo.utils.KyoUtils;
   
   public class HitVO
   {
      
      public var id:String;
      
      public var owner:IGameSprite;
      
      public var power:Number = 0;
      
      public var powerRate:Number = 1;
      
      public var hitType:int = 1;
      
      public var isBreakDef:Boolean = false;
      
      public var hitx:Number = 0;
      
      public var hity:Number = 0;
      
      public var hurtTime:Number = 300;
      
      public var hurtType:int = 0;
      
      public var checkDirect:Boolean = true;
      
      public var currentArea:Rectangle;
      
      private var _cloneKey:Array = ["id","owner","power","powerRate","hitType","isBreakDef","hitx","hity","hurtTime","hurtType","currentArea","checkDirect"];
      
      public function HitVO(param1:Object = null)
      {
         super();
         if(param1)
         {
            KyoUtils.setValueByObject(this,param1);
         }
         if(hitType == 1)
         {
            if(hurtTime < 100)
            {
               hurtTime = 100;
            }
         }
      }
      
      public function clone() : HitVO
      {
         var _loc1_:HitVO = new HitVO();
         KyoUtils.cloneValue(_loc1_,this,_cloneKey);
         return _loc1_;
      }
      
      public function isBisha() : Boolean
      {
         if(id == null)
         {
            return false;
         }
         return id.indexOf("bs") != -1 || id.indexOf("sbs") != -1 || id.indexOf("cbs") != -1 || id.indexOf("kbs") != -1;
      }
      
      public function isCatch() : Boolean
      {
         return hitType == 11 && isBreakDef;
      }
      
      public function getDamage() : int
      {
         return power * powerRate;
      }
   }
}

