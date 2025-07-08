// src/pages/ScheduleMeeting/index.tsx
import { useEffect, useState, useCallback } from 'react';

// ประกาศประเภทสำหรับ Google OAuth
declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token: string; error?: string }) => void;
          }) => {
            requestAccessToken: (options?: { prompt?: string }) => void;
          };
        };
      };
    };
  }
}

interface Event {
  id: string;
  summary: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
}

interface GoogleUser {
  access_token: string;
}

const ScheduleMeeting = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [googleUser, setGoogleUser] = useState<GoogleUser | null>(null);
  const [newEvent, setNewEvent] = useState({
    summary: '',
    startTime: '',
    endTime: ''
  });

  const listUpcomingEvents = useCallback((accessToken: string) => {
    const params = new URLSearchParams({
      timeMin: new Date().toISOString(),
      maxResults: '10',
      singleEvents: 'true',
      orderBy: 'startTime',
    });

    fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data: { items?: Event[] }) => {
        if (data.items) {
          setEvents(data.items);
        }
      })
      .catch((error) => {
        console.error('Error fetching events:', error);
      });
  }, []);

  const addNewEvent = useCallback((accessToken: string) => {
    const event = {
      summary: newEvent.summary,
      start: {
        dateTime: newEvent.startTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: newEvent.endTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    };

    fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data: Event) => {
        console.log('Event created:', data);
        listUpcomingEvents(accessToken);
        setNewEvent({ summary: '', startTime: '', endTime: '' });
      })
      .catch((error) => {
        console.error('Error creating event:', error);
      });
  }, [newEvent.summary, newEvent.startTime, newEvent.endTime, listUpcomingEvents]);

  useEffect(() => {
    const loadGoogleScript = () => {
      console.log('Loading Google script...');
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        console.log('Google script loaded successfully');
        initializeGoogleOAuth();
      };
      script.onerror = () => {
        console.error('Failed to load Google script');
      };
      document.body.appendChild(script);
    };

    const initializeGoogleOAuth = () => {
      console.log('Initializing Google OAuth...');
      
      if (!window.google?.accounts?.oauth2?.initTokenClient) {
        console.error('Google OAuth library not available');
        return;
      }

      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: '714676341308-p1gikv8ce6ujsgs0p18u19a6jn2n7kme.apps.googleusercontent.com',
        scope: 'https://www.googleapis.com/auth/calendar',
        callback: (response) => {
          console.log('Google OAuth response:', response);
          if (response.access_token) {
            setGoogleUser({ access_token: response.access_token });
            setIsAuthenticated(true);
            listUpcomingEvents(response.access_token);
          } else if (response.error) {
            console.error('Google OAuth error:', response.error);
          }
        },
      });

      const button = document.getElementById('google-signin-button');
      if (button) {
        console.log('Attaching click handler to button');
        button.onclick = () => {
          console.log('Sign-in button clicked');
          client.requestAccessToken({ prompt: 'consent' });
        };
      } else {
        console.error('Sign-in button element not found');
      }
    };

    loadGoogleScript();
  }, [listUpcomingEvents]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewEvent(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (googleUser) {
      addNewEvent(googleUser.access_token);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Google Calendar Integration</h1>
      
      {!isAuthenticated ? (
        <div>
          <p>Please sign in to manage your calendar events.</p>
          <button
            id="google-signin-button"
            style={{
              background: '#4285F4',
              color: 'white',
              padding: '10px 15px',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Sign in with Google
          </button>
        </div>
      ) : (
        <div>
          <h2>Create New Event</h2>
          <form onSubmit={handleSubmit} style={{ marginBottom: '30px' }}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Event Title:</label>
              <input
                type="text"
                name="summary"
                value={newEvent.summary}
                onChange={handleInputChange}
                required
                style={{ width: '100%', padding: '8px' }}
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Start Time:</label>
              <input
                type="datetime-local"
                name="startTime"
                value={newEvent.startTime}
                onChange={handleInputChange}
                required
                style={{ padding: '8px' }}
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>End Time:</label>
              <input
                type="datetime-local"
                name="endTime"
                value={newEvent.endTime}
                onChange={handleInputChange}
                required
                style={{ padding: '8px' }}
              />
            </div>
            <button
              type="submit"
              style={{
                background: '#34A853',
                color: 'white',
                padding: '10px 15px',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Add Event
            </button>
          </form>

          <h2>Your Upcoming Events</h2>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {events.length > 0 ? (
              events.map((event) => (
                <li 
                  key={event.id}
                  style={{
                    marginBottom: '15px',
                    padding: '15px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    background: '#f9f9f9'
                  }}
                >
                  <h3 style={{ marginTop: 0 }}>{event.summary}</h3>
                  <p>
                    <strong>Start:</strong> {new Date(event.start.dateTime).toLocaleString()}
                  </p>
                  <p>
                    <strong>End:</strong> {new Date(event.end.dateTime).toLocaleString()}
                  </p>
                </li>
              ))
            ) : (
              <p>No upcoming events found.</p>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ScheduleMeeting;