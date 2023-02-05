module.exports = {


  friendlyName: 'Borrow thing',


  description: 'Send a message to the owner of a thing requesting to borrow it, and mark it as borrowed.',


  inputs: {

    id: {
      description: 'The id of the thing being borrowed',
      type: 'number',
      required: true
    },

    expectedReturnAt: {
      type: 'number',
      description: 'A JS timestamp (epoch ms) representing the requested return time.',
      example: 1502844074211,
      required: true
    },

    pickupInfo: {
      type: 'string',
      description: 'The pickup time information to use in the message sent to the owner.',
      example: 'Tomorrow or thursday',
      required: true
    }

  },


  exits: {

    success: {
      description: 'A request has been sent to the item\'s owner, and the item is now marked as borrowed.'
    },

  },


  fn: async function ({id, expectedReturnAt, pickupInfo}) {

    var moment = require('moment');

    var borrowing = await Thing.findOne({ id }).populate('owner');

    // Check permissions.
    // (You can only borrow items from friends.)
    var itemBelongsToFriend = _.any(this.req.me.friends, {id: borrowing.owner.id});
    if (!itemBelongsToFriend) {
      throw 'forbidden';
    }

    // Format our text for the notification email.
    var itemLabel = borrowing.label || 'item';
    var formattedExpectedReturnAt = moment(expectedReturnAt).format('dddd, MMMM Do');
    var formattedPickupInfoText = pickupInfo.charAt(0).toLowerCase() + pickupInfo.slice(1);
    formattedPickupInfoText = formattedPickupInfoText.replace(/\.$/, '');

    // Send the owner a notification email.
    await sails.helpers.sendTemplateEmail.with({
      to: borrowing.owner.emailAddress,
      subject: 'Will you share your '+itemLabel,
      template: 'email-borrow-item',
      templateData: {
        borrowerName: this.req.me.fullName,
        borrowerEmail: this.req.me.emailAddress,
        itemLabel: itemLabel,
        fullName: borrowing.owner.fullName,
        pickupInfo: formattedPickupInfoText,
        expectedReturnAt: formattedExpectedReturnAt
      }
    });

    // Update the `thing` record to show it is being borrowed.
    await Thing.update({ id }).set({
      borrowedBy: this.req.me.id,
      expectedReturnAt: expectedReturnAt
    });

  }


};
