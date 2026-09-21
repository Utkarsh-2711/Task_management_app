// Forward rejected async controller promises to the centralized Express error middleware.
export function asyncHandler(controller) {
    return function wrappedController(request, response, next) {
        Promise.resolve(controller(request, response, next)).catch(next);
    };
}
