package com.wander.shared.web.request;

import com.wander.shared.kernel.constant.ErrorCodes;
import com.wander.shared.kernel.constant.ErrorMessages;
import com.wander.shared.kernel.error.ErrorKind;
import com.wander.shared.kernel.error.WanderException;
import jakarta.servlet.ReadListener;
import jakarta.servlet.ServletInputStream;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import java.io.IOException;

/**
 * A request whose body stream refuses to deliver more than a fixed number of bytes: the read that crosses the limit throws a 413
 * {@code BODY_TOO_LARGE} error, whichever component (the JSON parser, a form reader) is reading.
 */
public final class RequestBodyLimit extends HttpServletRequestWrapper {

    private final long maxBytes;
    private ServletInputStream limited;

    /** Wraps {@code request} so that its body cannot exceed {@code maxBytes}. */
    public RequestBodyLimit(HttpServletRequest request, long maxBytes) {
        super(request);
        this.maxBytes = maxBytes;
    }

    /** The size-limited body stream (created once, so repeated calls share the same counter). */
    @Override
    public ServletInputStream getInputStream() throws IOException {
        if (limited == null) {
            limited = new LimitedStream(super.getInputStream(), maxBytes);
        }
        return limited;
    }

    /** Counts bytes and fails the read that exceeds the limit. */
    private static final class LimitedStream extends ServletInputStream {

        private final ServletInputStream delegate;
        private final long maxBytes;
        private long total;

        private LimitedStream(ServletInputStream delegate, long maxBytes) {
            this.delegate = delegate;
            this.maxBytes = maxBytes;
        }

        @Override
        public int read() throws IOException {
            int value = delegate.read();
            if (value >= 0) {
                count(1);
            }
            return value;
        }

        @Override
        public int read(byte[] buffer, int offset, int length) throws IOException {
            int read = delegate.read(buffer, offset, length);
            if (read > 0) {
                count(read);
            }
            return read;
        }

        /** Adds to the running total and throws once it exceeds the limit. */
        private void count(int bytes) {
            total += bytes;
            if (total > maxBytes) {
                throw new WanderException(ErrorKind.PAYLOAD_TOO_LARGE, ErrorCodes.BODY_TOO_LARGE, ErrorMessages.BODY_TOO_LARGE, null, null);
            }
        }

        @Override
        public boolean isFinished() {
            return delegate.isFinished();
        }

        @Override
        public boolean isReady() {
            return delegate.isReady();
        }

        @Override
        public void setReadListener(ReadListener readListener) {
            delegate.setReadListener(readListener);
        }
    }
}
