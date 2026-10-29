(function () {
  const baseUrl = (window.BOOKING_API_URL || "http://localhost:3000/api/v1").replace(/\/+$/, "");

  async function request(path, options = {}) {
    let response;
    try {
      response = await fetch(`${baseUrl}${path}`, {
        ...options,
        headers: {
          Accept: "application/json",
          ...(options.body ? { "Content-Type": "application/json" } : {}),
          ...options.headers
        }
      });
    } catch {
      const networkError = new Error("Booking API is unavailable");
      networkError.code = "NETWORK_ERROR";
      throw networkError;
    }

    const body = await response.json().catch(() => null);
    if (!response.ok) {
      const message = Array.isArray(body?.message)
        ? body.message.join(", ")
        : body?.message || "Une erreur est survenue. Veuillez réessayer.";
      const error = new Error(message);
      error.status = response.status;
      error.code = body?.code;
      throw error;
    }
    return body;
  }

  async function authorizedRequest(path, accessToken, refreshToken, onTokens, options = {}) {
    try {
      return await request(path, {
        ...options,
        headers: { ...options.headers, Authorization: `Bearer ${accessToken}` }
      });
    } catch (error) {
      if (error.status !== 401 || !refreshToken) throw error;
      const tokens = await request("/auth/refresh", {
        method: "POST",
        body: JSON.stringify({ refreshToken })
      });
      onTokens(tokens);
      return request(path, {
        ...options,
        headers: { ...options.headers, Authorization: `Bearer ${tokens.accessToken}` }
      });
    }
  }

  const establishmentPath = slug => `/public/establishments/${encodeURIComponent(slug)}`;

  window.BookingApi = {
    login(identifier, password) {
      return request("/auth/login", {
        method: "POST",
        body: JSON.stringify({ identifier, password })
      });
    },
    getMe(accessToken, refreshToken, onTokens) {
      return authorizedRequest("/auth/me", accessToken, refreshToken, onTokens);
    },
    logout(accessToken, refreshToken, onTokens) {
      return authorizedRequest("/auth/logout", accessToken, refreshToken, onTokens, { method: "POST" });
    },
    getBookings(establishmentId, accessToken, refreshToken, onTokens, opts = {}) {
      const query = new URLSearchParams({ establishmentId });
      query.set("limit", String(opts.limit ?? 100));
      query.set("offset", String(opts.offset ?? 0));
      if (opts.from) query.set("from", opts.from);
      if (opts.to) query.set("to", opts.to);
      if (opts.status) query.set("status", opts.status);
      return authorizedRequest(`/bookings?${query}`, accessToken, refreshToken, onTokens);
    },
    transitionBooking(establishmentId, bookingId, status, reason, accessToken, refreshToken, onTokens) {
      const query = new URLSearchParams({ establishmentId });
      return authorizedRequest(`/bookings/${bookingId}/status?${query}`, accessToken, refreshToken, onTokens, {
        method: "PATCH",
        body: JSON.stringify(reason ? { status, reason } : { status })
      });
    },
    getDashboardSummary(establishmentId, accessToken, refreshToken, onTokens, range = {}) {
      const query = new URLSearchParams({ establishmentId });
      if (range.from) query.set("from", range.from);
      if (range.to) query.set("to", range.to);
      return authorizedRequest(`/dashboard/summary?${query}`, accessToken, refreshToken, onTokens);
    },
    getBookingsReport(establishmentId, accessToken, refreshToken, onTokens, range = {}) {
      const query = new URLSearchParams({ establishmentId });
      if (range.from) query.set("from", range.from);
      if (range.to) query.set("to", range.to);
      if (range.groupBy) query.set("groupBy", range.groupBy);
      return authorizedRequest(`/reports/bookings?${query}`, accessToken, refreshToken, onTokens);
    },
    getCustomers(establishmentId, accessToken, refreshToken, onTokens, opts = {}) {
      const query = new URLSearchParams();
      if (opts.q) query.set("q", opts.q);
      if (opts.cursor) query.set("cursor", opts.cursor);
      if (opts.limit) query.set("limit", String(opts.limit));
      const qs = query.toString();
      return authorizedRequest(`/establishments/${establishmentId}/customers${qs ? `?${qs}` : ""}`, accessToken, refreshToken, onTokens);
    },
    getCustomer(establishmentId, customerId, accessToken, refreshToken, onTokens) {
      return authorizedRequest(`/establishments/${establishmentId}/customers/${customerId}`, accessToken, refreshToken, onTokens);
    },
    getCustomerBookings(establishmentId, customerId, accessToken, refreshToken, onTokens, opts = {}) {
      const query = new URLSearchParams();
      if (opts.cursor) query.set("cursor", opts.cursor);
      if (opts.limit) query.set("limit", String(opts.limit));
      const qs = query.toString();
      return authorizedRequest(`/establishments/${establishmentId}/customers/${customerId}/bookings${qs ? `?${qs}` : ""}`, accessToken, refreshToken, onTokens);
    },
    getNotifications(establishmentId, accessToken, refreshToken, onTokens, opts = {}) {
      const query = new URLSearchParams({ establishmentId });
      if (opts.status) query.set("status", opts.status);
      if (opts.limit) query.set("limit", String(opts.limit));
      if (opts.offset) query.set("offset", String(opts.offset));
      return authorizedRequest(`/notifications?${query}`, accessToken, refreshToken, onTokens);
    },
    getNotificationSettings(establishmentId, accessToken, refreshToken, onTokens) {
      const query = new URLSearchParams({ establishmentId });
      return authorizedRequest(`/notification-settings?${query}`, accessToken, refreshToken, onTokens);
    },
    updateNotificationSettings(establishmentId, accessToken, refreshToken, onTokens, body) {
      const query = new URLSearchParams({ establishmentId });
      return authorizedRequest(`/notification-settings?${query}`, accessToken, refreshToken, onTokens, {
        method: "PATCH",
        body: JSON.stringify(body)
      });
    },
    getEstablishmentProfile(establishmentId, accessToken, refreshToken, onTokens) {
      return authorizedRequest(`/establishments/${establishmentId}`, accessToken, refreshToken, onTokens);
    },
    updateEstablishmentProfile(establishmentId, accessToken, refreshToken, onTokens, body) {
      return authorizedRequest(`/establishments/${establishmentId}`, accessToken, refreshToken, onTokens, {
        method: "PATCH",
        body: JSON.stringify(body)
      });
    },
    getCurrentSubscription(establishmentId, accessToken, refreshToken, onTokens) {
      const query = new URLSearchParams({ establishmentId });
      return authorizedRequest(`/subscriptions/current?${query}`, accessToken, refreshToken, onTokens);
    },
    getSubscriptionPlans(accessToken, refreshToken, onTokens) {
      return authorizedRequest(`/subscription-plans`, accessToken, refreshToken, onTokens);
    },
    subscribePlan(establishmentId, accessToken, refreshToken, onTokens, planCode) {
      const query = new URLSearchParams({ establishmentId });
      return authorizedRequest(`/subscriptions?${query}`, accessToken, refreshToken, onTokens, {
        method: "POST",
        body: JSON.stringify({ planCode })
      });
    },
    changeSubscriptionPlan(establishmentId, accessToken, refreshToken, onTokens, planCode) {
      const query = new URLSearchParams({ establishmentId });
      return authorizedRequest(`/subscriptions/change-plan?${query}`, accessToken, refreshToken, onTokens, {
        method: "POST",
        body: JSON.stringify({ planCode })
      });
    },
    getEstablishment(slug) {
      return request(establishmentPath(slug));
    },
    getServices(slug) {
      return request(`${establishmentPath(slug)}/services`);
    },
    getEmployees(slug, serviceId) {
      const query = new URLSearchParams({ serviceId });
      return request(`${establishmentPath(slug)}/employees?${query}`);
    },
    getAvailability(slug, serviceId, date, employeeId) {
      const query = new URLSearchParams({ serviceId, date });
      if (employeeId) query.set("employeeId", employeeId);
      return request(`${establishmentPath(slug)}/availability?${query}`);
    },
    createBooking(slug, payload, idempotencyKey) {
      return request(`${establishmentPath(slug)}/bookings`, {
        method: "POST",
        headers: { "Idempotency-Key": idempotencyKey },
        body: JSON.stringify(payload)
      });
    }
  };
})();
