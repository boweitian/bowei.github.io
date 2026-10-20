export default async function(request, context) {
  // Public visitor access. The function authenticates the private worker route.
  const response = await context.next();
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "same-origin");
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

export const config = {path: ["/iota", "/iota/*"]};
