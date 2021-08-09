// @ts-check

import { APIWrapper, API_EVENT_TYPE } from "./api.js";
import { addMessage, animateGift, isPossiblyAnimatingGift, isAnimatingGiftUI } from "./dom_updates.js";

const api = new APIWrapper('Öznur Kocamaz', false, true);

const not_animated_queue = [];
const animated_queue = [];
var timer = null;

/**
 * @param {import("./api.js").APIEvent} event
 */
function isMessageStillNew(event) {  
  var t = new Date(event.timestamp);
  t.setSeconds(t.getSeconds() + 20);
  return t > new Date();
}

/**
 * @param {import("./api.js").APIEvent} event
 */
function queue(event) {
  if(event.type == API_EVENT_TYPE.ANIMATED_GIFT)
  {
    animated_queue.push(event);
  } else {
    not_animated_queue.push(event);
  }
  if (timer === null) {  
    timer = setInterval(run, 500);  //There can only be one event shown to the user per 500ms
  } 
}

function run() {
  if (animated_queue.length > 0) {  // Animated Gifts are prioritized over all other types
    const event = animated_queue.shift();
    if (event !== undefined) {
      if(isPossiblyAnimatingGift()){ //There can only be at most one gift animation visible on screen at any given time
        console.log('animating');
        run();                     // UI should continue to update behind the gift animation
        animated_queue.unshift(event);
      } else {
        console.log('new animation');
        animateGift(event);
        addMessage(event);
      }
    }
  } else {
    const event = not_animated_queue.shift();
    if (event !== undefined) {
      if(event.type == API_EVENT_TYPE.GIFT) {
        addMessage(event);
      } else if(event.type == API_EVENT_TYPE.MESSAGE && isMessageStillNew(event) ) { // Events with the type MESSAGE older than 20 seconds should not be shown to the user.
        addMessage(event);
      } else {
        console.log('message expired: ' + event.timestamp + ' ' + new Date());
      }
    }
  }
}

api.setEventHandler((events) => {
  console.log(events);
  events.forEach(event => {  
    if (!animated_queue.some(e => e.id === event.id) && !not_animated_queue.some(e => e.id === event.id)) {  // Handle duplicate events.
      queue(event);
    } else {
      console.log('duplicate event id: ' + event.id);
    }

  });
  
})

// NOTE: UI helper methods from `dom_updates` are already imported above.
