import $ from 'jquery';
import NewArrival from "./modules/NewArrival";
import CommunityHolder from "./modules/CommunityHolder";
import Api from "./api/Api";
import Common from "./common/Common";
import AutoEnterRunner from './autoEnter/AutoEnterRunner'
import './chrome/runtime.onMessage';

const communityHolder = new CommunityHolder();
const newArrival = new NewArrival();
const BADGE_COLOR = '#ff6200';
const INTERVAL = 60 * 1000;

$(document).ready(() => {
  chrome.browserAction.setBadgeBackgroundColor({ color: BADGE_COLOR });
  refreshBadgeAndDB();
  setInterval(refreshBadgeAndDB, INTERVAL);
  setTimeout(() => {
    setInterval(() => {
      Promise.resolve()
        .then((new AutoEnterRunner()).run('live'))
        .then((new AutoEnterRunner()).run('community'));
    }, INTERVAL);
  }, 1000 * 5);
  initAutoEnterCommunityList();
});

const initAutoEnterCommunityList = () => {
  let autoEnterCommunityList = {};
  if (localStorage.getItem('autoEnterCommunityList')) {
    autoEnterCommunityList = JSON.parse(localStorage.getItem('autoEnterCommunityList'));
  }
  for (const id in autoEnterCommunityList) {
    autoEnterCommunityList[id].state = 'init';
  }
  localStorage.setItem('autoEnterCommunityList', JSON.stringify(autoEnterCommunityList));
};

const refreshBadgeAndDB = () => {
  Promise.resolve()
    .then(Api.isLogined)
    .catch(() => { setBadgeText('x'); })
    .then(() => Api.loadCasts('user'))
    .then(($videoInfos) => {
      setBadgeText(removeReservation($videoInfos).length);
      $.each(newArrival.get($videoInfos), (index, $infos) => {
        if (communityHolder.isNew($infos)) {
          // $infos is a followed community by a user as NEWLY.
          // Do nothing.
        } else {
          const communityId = `co${$infos.find('community id').text()}`; // co[0-9]+
          const liveId = $infos.find('video id').text(); // lv[0-9]+
          if (!existsInAutoLists(communityId, liveId)) {
            // A new broadCast will be show in a notification later.
            if (Common.enabledOrNull(localStorage.getItem('options.playsound.enable'))) {
              const soundFile = localStorage.getItem('options.soundfile') || 'ta-da.mp3';
              const volume    = localStorage.getItem('options.playsound.volume') || 1.0;
              const audio     = new Audio(`sounds/${soundFile}`);
              audio.volume    = volume;
              audio.play();
            }
            if (Common.enabledOrNull(localStorage.getItem('options.popup.enable'))) {
              showNotification($infos);
            }
          }
        }
      });
      newArrival.setSource($videoInfos);
    });
  // Get a list of following communities.
  Api.getCheckList().then((idList) => {
    communityHolder.setSource(idList);
  });
}

const existsInAutoLists = (communityId, liveId) => {
  let autoEnterCommunityList = {};
  let autoEnterProgramList = {};
  if (localStorage.getItem('autoEnterCommunityList')) {
    autoEnterCommunityList = JSON.parse(localStorage.getItem('autoEnterCommunityList'));
  }
  if (localStorage.getItem('autoEnterProgramList')) {
    autoEnterProgramList = JSON.parse(localStorage.getItem('autoEnterProgramList'));
  }
  for (const id in autoEnterCommunityList) {
    if (id === communityId) {
      return true;
    }
  }
  for (const id in autoEnterProgramList) {
    if (id === liveId) {
      return true;
    }
  }
  return false;
}

const showNotification = (newInfos) => {
  let duration = 6;
  if (localStorage.getItem('options.openingNotification.duration')) {
    duration = Number(localStorage.getItem('options.openingNotification.duration'));
  }
  console.info('duration = ', duration);
  const id = $(newInfos).first().find('video id').text();
  const options = {
    body: $(newInfos).first().find('video title').text(),
    icon: $(newInfos).first().find('community thumbnail').text(),
    tag: id
  };
  const notification = new Notification('放送開始のお知らせ', options);
  setTimeout(notification.close.bind(notification), duration * 1000);
  notification.onclick = () => {
    chrome.tabs.create({
      url: `http://live.nicovideo.jp/watch/${notification.tag}`,
      active: true
    });
  };
}

const setBadgeText = (value) => {
  new Promise((resolve) => {
    if (value == 0) {
      value = '';
    }
    chrome.browserAction.setBadgeText({
      text: String(value)
    });
    resolve();
  });
};

const removeReservation = ($videoInfos) => {
  const result = [];
  console.info($videoInfos);
  $.each($videoInfos, (index, $item) => {
    const is_reserved = $item.find('video is_reserved').text();
    if (is_reserved == 'false') {
      result.push($item);
    }
  });
  console.info(result);
  return $(result);
};
