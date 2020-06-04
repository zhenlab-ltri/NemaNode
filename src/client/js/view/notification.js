const $ = require('jquery');

const DataService = require('../data-service');

const BaseView = require('./base-view');

const { capitalizeFirstLetter } = require('../util');

/**
 * BaseView.notification
 * @constructor
 * @extends {BaseView}
 */
let NotificationView = function(model) {
  'use strict';

  const self = this;
  BaseView.call(this);

  let $container = $('#notification-container');
  let $template = $('#notification-template');

  let notifications = {};

  // ----- Events -----
  $container.on('click', '.close', function() {
    notifications[
      $(this)
        .parent()
        .attr('id')
    ].hide();
  });
  $container.on('mouseover', '.notification', function() {
    notifications[this.id].stopCountdown();
  });
  $container.on('mouseout', '.notification', function() {
    notifications[this.id].startCountdown();
  });

  // ---- Listeners -----
  model.on('warning info', function(obj, event) {
    self.display(
      event,
      obj.id,
      obj.message.replace('{0}', joinPretty(obj.arr || []))
    );
  });
  model.on('suppress', function(id) {
    self.hide(id);
  });

  // ----- Show/hide notifications -----
  this.display = function(type, id, body) {
    (
      notifications[id] || (notifications[id] = new Notification(type, id))
    ).display(body);
  };
  this.hide = function(id) {
    if (notifications.hasOwnProperty(id)) {
      notifications[id].hide();
    }
  };

  // ----- Notification object -----
  // Notification constructor. Type can be either 'Warning' or 'Info'.
  let delayBeforeFadeOut = 4000,
    fadeOutDuration = 1000,
    opacity = 0.7;
  /**
   * notification
   * @constructor
   */
  let Notification = function(type, id) {
    let thisNotification = this;

    let $notification;

    let isVisible = false;
    let countdown;

    this.display = function(body) {
      if (isVisible) {
        $notification.find('p').html(body);
        thisNotification.stopCountdown();
        thisNotification.startCountdown();
      } else {
        $notification = $template.clone();
        $notification.attr('id', id).addClass(type);
        $notification.find('h1').append(capitalizeFirstLetter(type));
        $notification.find('p').append(body);
        $container.append($notification);
        isVisible = true;
        thisNotification.startCountdown();
      }
    };

    this.hide = function() {
      if (isVisible) {
        $notification.stop().remove();
        isVisible = false;
      }
    };

    // Countdown starts when the notification is created or cursor moves away from notification.
    this.startCountdown = function() {
      countdown = setTimeout(function() {
        $notification.fadeOut(delayBeforeFadeOut, function() {
          thisNotification.hide();
        });
      }, fadeOutDuration);
    };
    // Countdown stops when cursor moves over the notification.
    this.stopCountdown = function() {
      $notification.stop().fadeTo(100, opacity);
      clearTimeout(countdown);
    };
  };

  // ----- Help functions -----
  let joinPretty = function(names) {
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
  };
};

NotificationView.prototype = Object.create(BaseView.prototype);
NotificationView.prototype.constructor = NotificationView;

module.exports = NotificationView;
