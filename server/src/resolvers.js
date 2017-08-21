import { PubSub } from 'graphql-subscriptions';
import { withFilter } from 'graphql-subscriptions';
import faker from 'faker';


const channels = [{
  id: '1',
  name: 'soccer',
  messages: [{
    id: '1',
    text: 'soccer is football',
  }, {
    id: '2',
    text: 'hello soccer world cup',
  }, {
    id: '3',
    text: 'message3'
  }, {
    id: '4',
    text: 'message4'
  }, {
    id: '5',
    text: 'message5'
  }, {
    id: '6',
    text: 'message6'
  }, {
    id: '7',
    text: 'message7'
  }, {
    id: '8',
    text: 'message8'
  }]
}, {
  id: '2',
  name: 'baseball',
  messages: [{
    id: '50',
    text: 'baseball is life',
  }, {
    id: '51',
    text: 'hello baseball world series',
  }]
}];

// use faker to generate random messages in soccer channel
const channel = channels.find(channel => channel.name === 'soccer');
let id;
for (id = 9; id < 50; id++) {
  channel.messages.push({
    id: id,
    text: faker.random.words()
  });
}

let nextId = 3;
let nextMessageId = 52;

const pubsub = new PubSub();

export const resolvers = {
  Query: {
    channels: () => {
      return channels;
    },

    channel: (root, args) => {
      let id = args.id
      let cursor = args['cursor'];
      let channel = channels.find(channel => channel.id === id);
      if (cursor == undefined && messageFeed == undefined) {
        cursor = channel.messages.length;
      }

      let messageFeed = {
        messages: channel.messages.slice(cursor-2, cursor),
        cursor: cursor - 2
      }

      let lessChannel = {
        id: channel.id,
        name: channel.name, 
        messageFeed: messageFeed
      }

      return lessChannel;
    },
  },
  Mutation: {
    addChannel: (root, args) => {
      const newChannel = { id: String(nextId++), messages: [], name: args.name };
      channels.push(newChannel);
      return newChannel;
    },
    addMessage: (root, { message }) => {
      const channel = channels.find(channel => channel.id === message.channelId);
      if(!channel)
        throw new Error("Channel does not exist");

      const newMessage = { id: String(nextMessageId++), text: message.text };
      channel.messages.push(newMessage);

      pubsub.publish('messageAdded', { messageAdded: newMessage, channelId: message.channelId });

      return newMessage;
    },
  },
  Subscription: {
    messageAdded: {
      subscribe: withFilter(() => pubsub.asyncIterator('messageAdded'), (payload, variables) => {
        // The `messageAdded` channel includes events for all channels, so we filter to only
        // pass through events for the channel specified in the query
        return payload.channelId === variables.channelId;
      }),
    }
  },
};
