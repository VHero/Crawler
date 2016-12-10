var http = require("http"),
    url = require("url"),
    superagent = require("superagent"),
    cheerio = require("cheerio"),
    async = require("async"),
    express = require("express"),
    eventproxy = require('eventproxy');

var app = express();
var articleItems = []; //每个文章的数据包含：作者姓名等
var topicUrls = []; //每个文章的链接
var cnodeUrl = "https://cnodejs.org";
var ep = new eventproxy(); // 得到一个 eventproxy 的实例
app.get('/cnode1', function(req, res, next) {
    console.log("cnode1");
    // 用 superagent 去抓取 https://cnodejs.org/ 的内容
    superagent.get('https://cnodejs.org/')
        .end(function(err, sres) {
            // 常规的错误处理
            if (err) {
                return next(err);
            }
            // sres.text 里面存储着网页的 html 内容，将它传给 cheerio.load 之后 
            // 就可以得到一个实现了 jquery 接口的变量，我们习惯性地将它命名为 `$`
            // 剩下就都是 jquery 的内容了
            var $ = cheerio.load(sres.text);
            var items = [];

            $('#topic_list .topic_title').each(function(idx, element) {
                var $element = $(element);
                items.push({
                    title: $element.attr('title'),
                    href: url.resolve(cnodeUrl, $element.attr('href'))
                });
            });
            res.send(items);
        });
});
app.get('/cnode2', function(req, res, next) {
    console.log("cnode2");
    // 用 superagent 去抓取 https://cnodejs.org/ 的内容
    superagent.get('https://cnodejs.org/')
        .end(function(err, sres) {
            // 常规的错误处理
            if (err) {
                return next(err);
            }
            // sres.text 里面存储着网页的 html 内容，将它传给 cheerio.load 之后 
            // 就可以得到一个实现了 jquery 接口的变量，我们习惯性地将它命名为 `$`
            // 剩下就都是 jquery 的内容了
            var $ = cheerio.load(sres.text);
            var items = [];
            $('#topic_list .cell').each(function(idx, element) {
                var $element = $(element);
                var item = {};
                item['link'] = url.resolve(cnodeUrl, $element.find('.topic_title').attr('href'));
                item['title'] = $element.find('.topic_title').attr('title');
                item['author'] = $element.find('.user_avatar img').attr('title');
                items.push(item);
            });
            res.send(items);
        });
});
app.get('/cnode3', function(req, res, next) {
    console.log("cnode3");
    // 用 superagent 去抓取 https://cnodejs.org/ 的内容
    superagent.get('https://cnodejs.org/')
        .end(function(err, sres) {
            // 常规的错误处理
            if (err) {
                return next(err);
            }
            // sres.text 里面存储着网页的 html 内容，将它传给 cheerio.load 之后 
            // 就可以得到一个实现了 jquery 接口的变量，我们习惯性地将它命名为 `$`
            // 剩下就都是 jquery 的内容了
            var $ = cheerio.load(sres.text);
            $('#topic_list .cell').each(function(idx, element) {
                var $element = $(element);
                var href = url.resolve(cnodeUrl, $element.find('.topic_title').attr('href'));
                topicUrls.push(href);
            });
            ep.after('topic_html', topicUrls.length, function(topics) {
                // topics 是个数组，包含了 40 次 ep.emit('topic_html', pair) 中的那 40 个 pair

                // 开始行动
                topics = topics.map(function(topicPair) {
                    var topicUrl = topicPair[0];
                    var topicHtml = topicPair[1];
                    var $ = cheerio.load(topicHtml);
                    return ({
                        title: $('.topic_full_title').text().trim(),
                        href: topicUrl,
                        comment1: $('.reply_content').eq(0).text().trim(),
                        name:$('.user_name .dark').text().trim(),
                        score:$('.board .floor .big').text().trim()
                    });
                })
                console.log('final:');
                console.log(topics);
            })
            topicUrls.forEach(function(topicUrl) {
                superagent.get(topicUrl)
                    .end(function(err, res) {
                        console.log('fetch ' + topicUrl + ' successful');
                        ep.emit('topic_html', [topicUrl, res.text]);
                    })
            })
            res.send(topicUrls);
        });
});
app.listen(3000, function() {
    console.log('app is listening at port 3000');
});
