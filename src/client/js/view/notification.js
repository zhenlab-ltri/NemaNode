const $ = require('jquery');

const DataService = require('../data-service');

const BaseView = require('./base-view');

const { capitalizeFirstLetter } = require('../util');


// ----- Notification object -----
// Type can be either 'Warning' or 'Info'.
const DELAY_BEFORE_FADE_OUT = 4000;
const FADE_OUT_DURATION = 1000;
const OPACITY = 0.7;

class Notification {

  constructor(type, id, $container, $template) {
    this.$container = $container;
    this.$notification = $template.clone();
    this.$notification.attr('id', id).addClass(type);
    this.$notification.find('h1').append(capitalizeFirstLetter(type));
    this.$notificationBody = this.$notification.find('p');

    this.isVisible = false;
    this.countdown;
  }

  display(body) {
    const {$notification, $notificationBody, $container} = this;
    $notificationBody.html(body);
    if (this.isVisible) {
      this.stopCountdown();
    } else {
      $container.append($notification);
      this.isVisible = true;
    }
    this.startCountdown();
  }

  hide() {
    const {$notification} = this;
    if (this.isVisible) {
      $notification.stop().remove();
      this.isVisible = false;
    }
  }

  // Countdown starts when the notification is created or cursor moves away from notification.
  startCountdown() {
    this.countdown = setTimeout(() => {
      this.$notification.fadeOut(DELAY_BEFORE_FADE_OUT, () => {
        this.hide();
      });
    }, FADE_OUT_DURATION);
  }

  // Countdown stops when cursor moves over the notification.
  stopCountdown() {
    const {$notification} = this;
    $notification.stop().fadeTo(100, OPACITY);
    clearTimeout(this.countdown);
  }
}


class NotificationView extends BaseView {

  constructor(model) {
    super();

    this.notifications = {};
    this.$container = $('#notification-container');
    this.$template = $('#notification-template');

    const {notifications, $container} = this;

    // ----- Events -----
    $container.on('click', '.close', (e) => {
      notifications[
        $(e.currentTarget).parent().attr('id')
      ].hide();
    });
    $container.on('mouseover', '.notification', (e) => {
      notifications[e.currentTarget.id].stopCountdown();
    });
    $container.on('mouseout', '.notification', (e) => {
      notifications[e.currentTarget.id].startCountdown();
    });

    // ---- Listeners -----
    model.on('warning info', (obj, event) => {
      this.display(
        event,
        obj.id,
        obj.message.replace('{0}', this.joinPretty(obj.arr || []))
      );
    });
    model.on('suppress', (id) => {
      this.hide(id);
    });
  }

  // ----- Show/hide notifications -----
  display(type, id, body) {
    const {notifications, $container, $template} = this;
    if (!notifications.hasOwnProperty(id)) {
      notifications[id] = new Notification(type, id, $container, $template);
    }
    notifications[id].display(body);
  }
  hide(id) {
    const {notifications} = this;
    if (notifications.hasOwnProperty(id)) {
      notifications[id].hide();
    }
  }

  // ----- Help functions -----
  joinPretty(names) {
    let displayNames = names
      .map(name => DataService.getDisplayName(name))
      .map(displayName => {
        return ['Body wall muscles', 'Defecation muscles'].includes(displayName)
          ? displayName.toLowerCase()
          : displayName;
      });

    switch (displayNames.length) {
      case 0:
        return '';
      case 1:
        return names[0];
      case 2:
        return `${names[0]} and ${names[1]}`;
      default:
        //case >2
        return `${names.slice(0, names.length - 1).join(', ')}, and ${
          names[names.length - 1]
        }`;
    }
  }
}

module.exports = NotificationView;
