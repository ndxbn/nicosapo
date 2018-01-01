import $ from "jquery";
import React from "react";
import GeneralThumbnails from "./GeneralThumbnails";
import Thumbnail from "../components/Thumbnail";

export default class OfficialThumbnails extends GeneralThumbnails {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      programs: [],
      thumbParams: []
    };
    this.setParams = this.setParams.bind(this);
  }

  componentDidMount() {
    super.loadCasts(this.props.genre, this.setParams);
  }

  componentWillReceiveProps(nextProps) {
    this.setState({ loading: true, thumbParams: [] }, () => {
      super.loadCasts(nextProps.genre, this.setParams);
    });

    // this.setState({ programs: nextProps.programs }, this.setParams);
  }

  setParams(programs) {
    if (programs == null) {
      this.setState({ thumbParams: [] });
      return;
    }
    const thumbParams = [];
    programs.forEach((program, index) => {
      const thumbParam = {};
      const $program = $(program);
      const communityId = $program.find(".video_text a").attr("href");
      const regexp = /http\:\/\/ch.nicovideo.jp\/channel\/(.+)/;
      const resultarr = regexp.exec(communityId);
      let thumbnailUrl;
      if (resultarr != null) {
        thumbnailUrl = `http://icon.nimg.jp/channel/${resultarr[1]}.jpg`;
      } else {
        thumbnailUrl = $program.find(".info a img").attr("src");
      }
      thumbParam.background = `url('${thumbnailUrl}')`;
      thumbParam.title = $program.find(".video_title").text();
      thumbParam.id = `lv${$program.find(".video_id").text()}`;
      thumbParam.url = `http://live.nicovideo.jp/watch/${thumbParam.id}`;
      thumbParam.text = thumbParam.title;
      thumbParam.index = index;
      thumbParam.openTime = $program.has(".reserve").length
        ? `20${$program.find(".time").text()} 開場`
        : undefined;
      thumbParams.push(thumbParam);
      if (index == programs.length - 1) {
        this.setState({
          thumbParams: thumbParams.slice(0, 99),
          loading: false
        });
        // setTimeout(() => {
        //   this.setState({
        //     thumbParams: thumbParams.slice(0, thumbParams.length - 1)
        //   });
        // }, 1000);
        // const step = 6;
        // let endId = 0;
        // const timer = setInterval(() => {
        //   this.setState({
        //     thumbParams: thumbParams.slice(0, endId + step),
        //     loading: false
        //   });
        //   endId += step;
        //   if (endId >= 31) {
        //     clearInterval(timer);
        //   }
        // }, 10);
      }
    });
  }

  render() {
    if (this.state.thumbParams == null) {
      return <div id="container" />;
    }
    return (
      <div id="container" className={this.state.loading ? "nowloading" : ""}>
        {this.state.thumbParams.map(thumbParam => (
          <Thumbnail
            key={thumbParam.id}
            preload={thumbParam.index == 0}
            background={thumbParam.background}
            title={thumbParam.title}
            url={thumbParam.url}
            id={thumbParam.id}
            text={thumbParam.text}
            index={thumbParam.index}
            openTime={thumbParam.openTime}
          />
        ))}
      </div> // TODO: delete container
    );
  }
}
