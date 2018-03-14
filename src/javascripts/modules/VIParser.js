import VideoInfo from "../modules/VideoInfo";

export default class VIParser {
  static parse(element) {
    // const videoProps = VIParser._videoProps(element);
    // const communityProps = VIParser._communityProps(element);
    const videoInfo = new VideoInfo();

    const video = {
      title: element.querySelector("[class^=___social-group-name___]").textContent,
      id: element.querySelector("[class^=___anchor___]").href.match(/lv\d+/)[0],
      is_reserved: element.is_reserved
    };

    // console.log(element.querySelector("[class^=___thumbnail___]").src);

    const provider = {
      id: element
        .querySelector("[class^=___social-group-icon___] > img")
        .src.match(/(co|ch)\d+\.jpg/)[0]
        .replace(".jpg", ""),
      thumbnail: element.querySelector("[class^=___social-group-icon___] > img").src
    };

    videoInfo.video().set("title", video.title);
    videoInfo.video().set("id", video.id);
    // videoInfo.video().set("openTimeJp", element.start_time);
    videoInfo.video().set("openTimeJp", video.id);
    videoInfo.video().set("isReserved", video.is_reserved);

    videoInfo.community().set("id", provider.id);
    videoInfo.community().set("thumbnail", provider.thumbnail);
    return videoInfo.xml();
  }
}
