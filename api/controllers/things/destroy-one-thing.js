module.exports = {


  friendlyName: 'Destroy one thing',


  description: 'Delete a thing that is no longer borrowable.',


  inputs: {

    id: {
      description: 'The id of the thing to destroy',
      type: 'number',
      required: true
    },

  },


  exits: {

    notFound: {
      responseType: 'notFound'
    },

    forbidden: {
      responseType: 'forbidden'
    },

  },


  fn: async function ({id}) {

    var thingToDestroy = await Thing.findOne({ id });
    // Ensure the thing still exists.
    if(!thingToDestroy) {
      throw 'notFound';
    }
    // Verify permissions.
    if(thingToDestroy.owner !== this.req.me.id) {
      throw 'forbidden';
    }

    // Archive the record.
    await Thing.archiveOne({ id });

  }

};
