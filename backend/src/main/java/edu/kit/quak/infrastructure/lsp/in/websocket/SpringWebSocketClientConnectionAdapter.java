package edu.kit.quak.infrastructure.lsp.in.websocket;

import edu.kit.quak.application.lsp.ports.out.LspClientConnectionPort;
import java.io.IOException;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

public class SpringWebSocketClientConnectionAdapter implements LspClientConnectionPort {

    private final WebSocketSession session;

    public SpringWebSocketClientConnectionAdapter(WebSocketSession session) {
        this.session = session;
    }

    public void sendToClient(String message) throws IOException {
        session.sendMessage(new TextMessage(message));
    }

    @Override
    public void close(int code, String reason) throws IOException {
        session.close(new CloseStatus(code, reason));
    }

    @Override
    public boolean isOpen() {
        return session.isOpen();
    }
}
