'use strict';
var isomorphicFetch = require('isomorphic-fetch');
var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'front.end.digest@gmail.com',
        pass: 'xxx'
    }
});

fetch('http://localhost:8081/topics/pending')
    .then(function(response) {
        if (response.status >= 400) {
            throw new Error("Bad response from server");
        }
        return response.json();
    })
    .then(function(topics) {
        var topicMarkup = '';

        for(var i = 0; i < topics.length; i++) {
            var currTopic = topics[i];
            var buffer = new Buffer(currTopic.description || '');
            var bufferConverted = buffer.toString('utf8');
            var urlMarkup = currTopic.url ? '<div>url: <a href=' + currTopic.url + '>' + currTopic.url + '</a></div>' : '';
            topicMarkup += "<div>" +
                "<div><strong>" + currTopic.name + "</strong>: " + bufferConverted + "</div>" + urlMarkup +
                "<br /></div>";
        }

        var bodyMarkup = "<div>" +
            "<div>Current Topics:</div><br />" + topicMarkup + "</div>";

        // this sends the email
        transporter.sendMail({
            from: 'front.end.digest@gmail.com',
            to: 'cheryl@1stdibs.com',
            subject: '1stDibs Front-End Email Digest',
            html: bodyMarkup
        }, function(err, data) {
            if (err) {
                throw err;
            }

            // mark items as no longer pending
            var today = new Date();
            fetch('http://localhost:8081/topics/sent', {
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
