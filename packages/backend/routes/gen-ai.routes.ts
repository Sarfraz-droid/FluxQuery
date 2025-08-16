const genAiRoutes = {
    '/get-models': () => new Response("ok", { status: 200 }),
    '/fix-with-ai': () => new Response("ok", { status: 200 }),
    '/transaction-status/{transactionId}': () => new Response("ok", { status: 200 }),
}

export default genAiRoutes;