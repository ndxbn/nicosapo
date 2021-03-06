import moment from 'moment';
import Common from "../common/Common";

export default class UserThumbnails {
  static getParams(programs, isShowReservedStream = false) {
    if (programs.length === 0) {
      const message = document.createElement("div");
      message.className = "message";
      message.textContent = "フォロー中の コミュニティ・チャンネル が放送している番組がありません．";
    }

    const thumbParams = [];
    let index = 0;

    programs.forEach(program => {
      const isReserved = UserThumbnails.isReserved(program);

      const thumbParam = {};
      const thumbnailUrl = program.querySelector("community thumbnail").textContent;

      thumbParam.background = `url('${thumbnailUrl}')`;
      thumbParam.title = program.querySelector("video title").textContent;
      thumbParam.id = program.querySelector("video id").textContent;
      thumbParam.url = `https://live.nicovideo.jp/watch/${thumbParam.id}`;
      thumbParam.text = thumbParam.title;

      const dateJpnOrig = program.querySelector("video open_time_jpstr").textContent;
      // => "03/15(木) 開場 18:00 開演 18:00"
      // これを "2018/03/13(火) 18:00" の書式にすれば Date で parse できる

      const dateJpnMin = dateJpnOrig.split(" ")[0];
      // => "03/15(木)"

      const dateJpnWithoutDay = dateJpnMin.split("(")[0];
      // => "03/15"

      const dateJpnYear = `${new Date().getFullYear()}/${dateJpnWithoutDay}`;
      // => "2018/03/15"`

      const timeJpn = dateJpnOrig.match(/\d{2}:\d{2}/)[0];
      // => "18:00"

      const hour = timeJpn.split(':')[0];
      // => 18

      const minute = timeJpn.split(':')[1];
      // => 00

      const cutoffHour = `0${Math.min(hour, 23)}`.slice(-2);
      // => 18

      const restHour = hour - cutoffHour;
      // hour === 27, cutoffHour === 23 なら 4

      const dateJpn = `${dateJpnYear} ${cutoffHour}:${minute}`;
      // => "2018/03/13 18:00"

      console.log(dateJpn.replace(/[\t\r\n]/g, ""));

      const start = moment(dateJpn.replace(/[\t\r\n]/g, "").replace(/\//g, "-"));
      start.add(restHour, 'hours');

      const date = new Date(start);

      thumbParam.openDate = date;

      thumbParam.isReserved = UserThumbnails.isReserved(program);
      thumbParam.isOfficial = false;
      thumbParam.openTime = thumbParam.isReserved ? dateJpnOrig : undefined;

      const today = new Date();
      switch (date.getDate() - today.getDate()) {
        case 0:
          thumbParam.day = `今日`;
          break;
        case 1:
          thumbParam.day = `明日`;
          break;
        case 2:
        case 3:
        case 4:
        case 5:
        case 6:
          thumbParam.day = Common.jpDay(date.getDay());
          break;
        default:
          thumbParam.day = `${date.getDate()}日`;
          break;
      }

      if (isShowReservedStream && isReserved) {
        thumbParam.index = index++;
        thumbParams.push(thumbParam);
      } else if (!isShowReservedStream && !isReserved) {
        thumbParam.index = index++;
        thumbParams.push(thumbParam);
      }
    });

    return thumbParams;
  }

  static isReserved(program) {
    const is_reserved = program.querySelector("video is_reserved").textContent;
    return is_reserved == "true";
  }
}
