function notifyRedmineChanging() {
  console.info("Redmine Notification Task start...");
  
  // get properties
  var property = PropertiesService.getScriptProperties();
  var CW_TOKEN = property.getProperty("CW_TOKEN");
  var ROOM_ID = property.getProperty("ROOM_ID");
  var CW_URL = property.getProperty("CW_URL").replace(/%room_id%/g, ROOM_ID);
  var TARGET_LABEL = property.getProperty("TARGET_LABEL");
  var MESSAGE_TO = property.getProperty("MESSAGE_TO");
  var HEADERS = {"X-ChatWorkToken": CW_TOKEN};
  
  
  // 昨日以降の未読スレッド(label:redmine-ias)
  var date = new Date();
  date.setDate(date.getDate()-1);
  var nowStr = Utilities.formatDate(date, "JST", "yyyy/MM/dd");
  //var nowStr = "2019/11/28";
  var searchStr = "label:" + TARGET_LABEL + " after:" + nowStr + " is:unread";
  console.info("Search Gmail with %s", searchStr);
  var threads = GmailApp.search(searchStr);

  for (var i=0; i<threads.length; i++) {
    var msgs = threads[i].getMessages();
    
    for (var r=0; r<msgs.length; r++) {
      var msg = msgs[r];
      if (!msg.isUnread()) {
        continue;
      }
      var body = msgs[r].getBody();
      
      var text = body.match(/チケット.*されました。/g)[0];
      var data = Utilities.parseCsv(text, ' ');
      var firstName = data[0][6];
      var familyName = data[0][5];
      var href = data[0][2];
      var link = Utilities.parseCsv(href, '"')[0][1];
      var ticketNo = (/>(\#[0-9]+)<\//g).exec(data[0][3])[1];
      var chatMsg = MESSAGE_TO + "\n" + familyName + " " + firstName + " さんがチケット " + ticketNo + " を追加/更新しました。\n" + link;
      
      // Chatworkへ
      var options = {
        "method" : "POST",
        "headers" : HEADERS,
        "payload" : "body=" + chatMsg + "&self_unread=1"
      };
      var response = UrlFetchApp.fetch(CW_URL, options);
      console.info("Notify to Chatwork msg: %s", chatMsg);
      
      msg.markRead();
    }
  }
  
  console.info("Redmine Notification Task end.");
}
