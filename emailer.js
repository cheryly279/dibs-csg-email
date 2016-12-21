// load aws sdk
var aws = require('aws-sdk');
var isomorphicFetch = require('isomorphic-fetch');

// load aws config
aws.config.loadFromPath('/home/ec2-user/dibs-csg-emailer/config.json');

// load AWS SES
var ses = new aws.SES({apiVersion: '2010-12-01'});

// send to list
var to = ['cheryl@1stdibs.com'];

// this must relate to a verified SES account
var from = 'front.end.digest@gmail.com';

isomorphicFetch('http://ec2-54-144-194-47.compute-1.amazonaws.com:8081/topics/pending')
    .then(function(response) {
        if (response.status >= 400) {
            throw new Error("Bad response from server");
        }
        return response.json();
    })
    .then(function(topics) {
        var bodyText = '';

        for(var i = 0; i < topics.length; i++) {
            var currTopic = topics[i];
            var buffer = new Buffer( currTopic.description || '');
            var bufferConverted = buffer.toString('utf8');
            bodyText += "Topic: " + currTopic.name + "\r\nDescription: " + (bufferConverted) + "\r\nUrl: " + currTopic.url + "\r\n\r\n";
        }

        // this sends the email
        ses.sendEmail({
            Source: from,
            Destination: { ToAddresses: to },
            Message : {
                Subject: {
                    Data: '1stDibs Front-End Email Digest'
                },
                Body: {
                    Text: {
                        Data: bodyText,
                    }
                }
            }
        }, function(err, data) {
            if (err) {
                throw err;
            }

            // make items as no longer pending
            var today = new Date();
            fetch('http://ec2-54-144-194-47.compute-1.amazonaws.com:8081/topics/sent', {
                method: 'PUT',
                body: JSON.stringify({
                    sentDate: today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate(),
                    topicIds: topics.map(topic => topic.id)
                }),
                headers: new Headers({
                    'Content-Type': 'application/json'
                })
            });
        });
    });
