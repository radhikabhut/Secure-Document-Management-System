package middleware

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/time/rate"
)

type client struct {
	limiter  *rate.Limiter
	lastSeen time.Time
}

// RateLimiter creates a middleware that limits requests by IP address.
// requestsPerSecond is the number of requests per second, and burst is the maximum burst size.
func RateLimiter(requestsPerSecond float64, burst int) gin.HandlerFunc {
	r := rate.Limit(requestsPerSecond)
	b := burst
	var (
		mu      sync.Mutex
		clients = make(map[string]*client)
	)

	// Clean up old clients every minute to prevent memory leaks
	go func() {
		for {
			time.Sleep(time.Minute)
			mu.Lock()
			for ip, c := range clients {
				if time.Since(c.lastSeen) > 3*time.Minute {
					delete(clients, ip)
				}
			}
			mu.Unlock()
		}
	}()

	return func(c *gin.Context) {
		ip := c.ClientIP()
		mu.Lock()
		if _, found := clients[ip]; !found {
			// Create a new limiter for this IP
			clients[ip] = &client{limiter: rate.NewLimiter(r, b)}
		}
		clients[ip].lastSeen = time.Now()
		
		// If the request is not allowed, abort and return 429
		if !clients[ip].limiter.Allow() {
			mu.Unlock()
			c.JSON(http.StatusTooManyRequests, gin.H{
				"success": false,
				"message": "Too many requests. Please try again later.",
			})
			c.Abort()
			return
		}
		mu.Unlock()
		c.Next()
	}
}
