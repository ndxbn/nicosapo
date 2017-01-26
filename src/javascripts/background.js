import $ from 'jquery'
import NewArrival from "./modules/NewArrival";
import CommunityHolder from "./modules/CommunityHolder";
import Napi from "./api/Api";
import Common from "./common/Common";
import AutoEnterRunner from './autoEnter/AutoEnterRunner'

const communityHolder = new CommunityHolder();
const newArrival = new NewArrival();
const BADGE_COLOR = '#ff6200';
const INTERVAL = 30 * 1000;

chrome.notifications.onClicked.addListener((id) => {
  chrome.tabs.create({
    url: `http://live.nicovideo.jp/watch/${id}`,
    active: true
  });
});

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
  const storagedData = JSON.parse(localStorage.getItem('autoEnterCommunityList'));
  for (const id in storagedData) {
    storagedData[id].state = 'init';
  }
  localStorage.setItem('autoEnterCommunityList', JSON.stringify(storagedData));
};

const refreshBadgeAndDB = () => {
  Promise.resolve()
    .then(Napi.isLogined)
    .catch(() => { setBadgeText('x'); })
    .then(() => Napi.loadCasts('user'))
    .then(($videoInfos) => {
      setBadgeText(removeReservation($videoInfos).length);
      $.each(newArrival.get($videoInfos), (index, $infos) => {
        if (communityHolder.isNew($infos)) {
          // $infos is a followed community by a user as NEWLY.
          // Do nothing.
        } else {
          if (Common.enabledOrNull(localStorage.getItem('options.playsound.enable'))) {
            const soundFile = localStorage.getItem('options.soundfile') || 'ta-da.mp3';
            const volume    = localStorage.getItem('options.playsound.volume') || 1.0;
            const audio     = new Audio(`sounds/${soundFile}`);
            audio.volume    = volume;
            audio.play();
          }
          if (Common.enabledOrNull(localStorage.getItem('options.popup.enable'))) {
            const communityId = `co${$infos.find('community id').text()}`; // co[0-9]+
            const liveId = $infos.find('video id').text(); // lv[0-9]+
            if (!existsInAutoLists(communityId, liveId)) {
              // A new broadCast will be show in a notification later.
              showNotification($infos);
            }
          }
        }
      });
      newArrival.setSource($videoInfos);
    });
  // Get a list of following communities.
  Napi.getCheckList().then((idList) => {
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

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.purpose == 'getFromLocalStorage') {
    sendResponse(localStorage.getItem(request.key));
    return;
  }

  if (request.purpose == 'saveToLocalStorage') {
    localStorage.setItem(request.key, request.value);
    return;
  }

  if (request.purpose == 'removeFromLocalStorage') {
    localStorage.removeItem(request.key);
    return;
  }

  if (request.purpose == 'getFromNestedLocalStorage') {
    let storagedData = {};
    if (localStorage.getItem(request.key)) {
      storagedData = JSON.parse(localStorage.getItem(request.key));
    }
    sendResponse(storagedData);
  }

  // localStorage->{id->{state, test, ...}, id->{state, test, ...}}
  if (request.purpose == 'saveToNestedLocalStorage') {
    let storagedData = {};
    if (localStorage.getItem(request.key)) {
      storagedData = JSON.parse(localStorage.getItem(request.key));
    }
    storagedData[request.innerKey] = {};
    storagedData[request.innerKey].state = request.innerValue.state;
    storagedData[request.innerKey].thumbnail = request.innerValue.thumbnail;
    storagedData[request.innerKey].title = request.innerValue.title;
    if (request.innerValue.openDate) {
      storagedData[request.innerKey].openDate = request.innerValue.openDate;
    }
    if (request.innerValue.owner) {
      storagedData[request.innerKey].owner = request.innerValue.owner;
    }
    localStorage.setItem(request.key, JSON.stringify(storagedData));
    return;
  }

  if (request.purpose == 'removeFromNestedLocalStorage') {
    let storagedData = {};
    if (localStorage.getItem(request.key)) {
      storagedData = JSON.parse(localStorage.getItem(request.key));
    }
    console.info('[nicosapo] Delete storagedData[innerKey] ', storagedData[request.innerKey]);
    delete storagedData[request.innerKey];
    localStorage.setItem(request.key, JSON.stringify(storagedData));
    return;
  }
});

const showNotification = (newInfos) => {
  const options = {
    type: "basic",
    title: "放送開始のお知らせ",
    message: $(newInfos).first().find('video title').text(),
    iconUrl: $(newInfos).first().find('community thumbnail').text()
  };
  const id = $(newInfos).first().find('video id').text();
  chrome.notifications.create(id, options);
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
