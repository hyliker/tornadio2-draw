import os
import tornado.web
import tornadio2
import tornado.ioloop
import collections
from tornado.options import options, define, parse_command_line

ROOT_DIR = os.path.abspath(os.path.dirname(__file__))

define('port', type=int, default=8888)
define("draw", type=int, default=1000)

settings = dict(
    template_path = os.path.join(ROOT_DIR, 'templates'),
    static_path = os.path.join(ROOT_DIR, 'static'),
)


class IndexHandler(tornado.web.RequestHandler):
    def get(self):
        self.render("index.html")

class SocketIOConnection(tornadio2.SocketConnection):
    users = set()
    drawDataList = collections.deque(maxlen=options.draw)

    def on_open(self, info):
        self.users.add(self)
        
        online_number = len(self.users)
        for user in self.users:
            user.emit("online", online_number)

        for data in self.drawDataList:
            self.emit("draw", data)

    def on_message(self, message):
        for user in self.users:
            user.send(message)

    @tornadio2.event
    def clear(self):
        self.drawDataList.clear()
        for user in self.users:
            if user != self:
                user.emit("clear")

    @tornadio2.event
    def draw(self, message):
        self.drawDataList.append(message)
        for user in self.users:
            if user != self:
                user.emit("draw", message)

    def on_close(self):
        self.users.remove(self)
        online_number = len(self.users)
        for user in self.users:
            user.emit("online", online_number)
    
SocketIORouter = tornadio2.router.TornadioRouter(SocketIOConnection, user_settings={"session_check_interval": 15, "session_expiry": 30})


application = tornado.web.Application(SocketIORouter.apply_routes([
    (r"/", IndexHandler),
]), **settings)


if __name__ == "__main__":
    import logging
    logging.getLogger().setLevel(logging.DEBUG)
    parse_command_line()
    print "server is listening %s" % options.port
    application.listen(options.port)
    tornado.ioloop.IOLoop.instance().start()
