const statusRoutes = {
    '/health': () => new Response("ok", { status: 200 }),
}

export default statusRoutes;