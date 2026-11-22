package net.play5d.game.bvn.utils
{
   import flash.display.Bitmap;
   
   public class EmbedAssetUtils
   {
      
      private static var _alipay:Bitmap;
      
      private static var _weixin:Bitmap;
      
      private static var _patreon:Bitmap;
      
      private static var alipayPNG:Class = alipay_png;
      
      private static var weixinPNG:Class = weixin_png$0695560ee96ccebffb0639139cafa90d556300827;
      
      private static var patreonPNG:Class = patreon_png;
      
      public function EmbedAssetUtils()
      {
         super();
      }
      
      public static function getAlipay() : Bitmap
      {
         if(!_alipay)
         {
            _alipay = new alipayPNG();
            _alipay.smoothing = true;
         }
         return _alipay;
      }
      
      public static function getWeixin() : Bitmap
      {
         if(!_weixin)
         {
            _weixin = new weixinPNG();
            _weixin.smoothing = true;
         }
         return _weixin;
      }
      
      public static function getPatreon() : Bitmap
      {
         if(!_patreon)
         {
            _patreon = new patreonPNG();
            _patreon.smoothing = true;
         }
         return _patreon;
      }
   }
}

