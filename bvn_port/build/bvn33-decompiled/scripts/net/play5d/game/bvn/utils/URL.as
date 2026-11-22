package net.play5d.game.bvn.utils
{
   import net.play5d.kyo.utils.WebUtils;
   
   public class URL
   {
      
      public static var MARK:String = "bvn";
      
      public static const WEBSITE:String = "http://www.5dplay.net/";
      
      public static const BBS:String = "http://bbs.5dplay.net/";
      
      public static const DOWNLOAD:String = "http://bbs.5dplay.net/forum.php?mod=viewthread&tid=682&extra=page%3D1";
      
      public static const DOWNLOAD_ANDROID:String = "http://www.3839.com/a/88720.htm";
      
      public function URL()
      {
         super();
      }
      
      public static function go(param1:String, param2:Boolean = true) : void
      {
         var _loc3_:String = null;
         if(param2)
         {
            _loc3_ = markURL(param1);
            WebUtils.getURL(_loc3_);
         }
         else
         {
            WebUtils.getURL(param1);
         }
      }
      
      public static function markURL(param1:String) : String
      {
         var _loc2_:String = param1.indexOf("?") == -1 ? "?" : "&";
         return param1 + _loc2_ + MARK;
      }
      
      public static function website(... rest) : void
      {
         go("http://www.5dplay.net/");
      }
      
      public static function buyJoystick(... rest) : void
      {
         go("http://bbs.5dplay.net/forum.php?mod=viewthread&tid=110",false);
      }
      
      public static function bbs(... rest) : void
      {
         go("http://bbs.5dplay.net/");
      }
      
      public static function supportUS(... rest) : void
      {
         go("https://www.patreon.com/bleachvsnaruto",false);
      }
      
      public static function download() : void
      {
         go("http://bbs.5dplay.net/forum.php?mod=viewthread&tid=682&extra=page%3D1",false);
      }
      
      public static function download_android(... rest) : void
      {
         go("http://www.3839.com/a/88720.htm");
      }
   }
}

