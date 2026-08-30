package dbpool

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/jackc/pgx/v5"
)

// slowQueryThreshold controls which queries get logged: slower than this
// or failed.
const slowQueryThreshold = time.Second

var (
	tracerInfoLog  = log.New(os.Stdout, "INFO ", log.LstdFlags)
	tracerWarnLog  = log.New(os.Stderr, "WARNING ", log.LstdFlags)
	tracerErrorLog = log.New(os.Stderr, "ERROR ", log.LstdFlags)
)

// tracerCtxKey carries the event state from Trace*Start to Trace*End.
type tracerCtxKey struct{}

type tracerState struct {
	start time.Time
	sql   string
	host  string
	port  uint16
}

// logTracer implements pgx.QueryTracer and pgx.ConnectTracer. It logs every
// connection establishment and slow/failed queries — the facts needed to tell
// reused pool connections apart from fresh dials during the Neon investigation.
type logTracer struct{}

func (logTracer) TraceQueryStart(ctx context.Context, _ *pgx.Conn, data pgx.TraceQueryStartData) context.Context {
	return context.WithValue(ctx, tracerCtxKey{}, tracerState{start: time.Now(), sql: data.SQL})
}

func (logTracer) TraceQueryEnd(ctx context.Context, _ *pgx.Conn, data pgx.TraceQueryEndData) {
	state, ok := ctx.Value(tracerCtxKey{}).(tracerState)
	if !ok {
		return
	}
	took := time.Since(state.start)
	switch {
	case data.Err != nil:
		tracerErrorLog.Printf("pgx query: took=%s sql=%q err=%v", took, state.sql, data.Err)
	case took >= slowQueryThreshold:
		tracerWarnLog.Printf("pgx query: took=%s sql=%q", took, state.sql)
	}
}

func (logTracer) TraceConnectStart(ctx context.Context, data pgx.TraceConnectStartData) context.Context {
	return context.WithValue(ctx, tracerCtxKey{}, tracerState{
		start: time.Now(),
		host:  data.ConnConfig.Host,
		port:  data.ConnConfig.Port,
	})
}

func (logTracer) TraceConnectEnd(ctx context.Context, data pgx.TraceConnectEndData) {
	state, ok := ctx.Value(tracerCtxKey{}).(tracerState)
	if !ok {
		return
	}
	line := fmt.Sprintf("pgx connect: host=%s port=%d took=%s", state.host, state.port, time.Since(state.start))
	if data.Err != nil {
		tracerErrorLog.Printf("%s err=%v", line, data.Err)
	} else {
		tracerInfoLog.Println(line)
	}
}
