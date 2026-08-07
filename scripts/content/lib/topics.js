const topics = require("../../../content/topics.json");

const TOPICS = Object.freeze(
  topics.map(topic => ({ name: topic.name, slug: topic.slug }))
);
const knownTopicNames = new Set(TOPICS.map(topic => topic.name));

function getUnknownTopics(tags) {
  return [...new Set(tags.filter(tag => !knownTopicNames.has(tag)))];
}

module.exports = {
  TOPICS,
  getUnknownTopics,
};
