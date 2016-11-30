A local, serverless, pocket-like firefox addon.

# What does it do?

Adds an option when right clicking on links and web pages to save the link 
for later viewing. Pretty simple. No frills.

# Dev

This is made with [Jetpack](https://developer.mozilla.org/en-US/Add-ons/SDK).
A simpler way of making extensions for Firefox.

I didn't know about Web Extensions 
(which supposedly make extensions for Chrome and Firefox), so... yeah.

## Requirements

 * Node.js
 * Firefox

## Getting started

```bash
# Install nodes.js deps
npm install
# Start a firefox instance with test
# Each run starts a new instance with a new profile
npm run start
```

`npm run "start persistent"` will create *.tmp/profile* which will keep data across restarts.
This can help with testing. Just delete the folder if you want to start afresh.