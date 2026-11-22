// Two things need a service the planner does not have by itself.
//
// Finding the rooms on an uploaded floor plan needs an account service.
// Home Assistant passes its own through floorPlannerHost.recognise. A site
// that offers the planner on its own replaces this module with one that
// exports recognise(image): a function that takes the plan as a JPEG data URL
// and resolves to { recognition, quota }, or rejects with an error that has a
// code (and a quota when the service sent one).
export const recognise = null;

// Sharing a plan with a link needs a place that keeps the plan. Such a site
// exports sharing: { key, open(), save(project) }. key is what the address of
// the page says about a shared plan, or null. open() resolves to the project
// behind that key, or to null when it is no longer there. save(project) keeps
// a plan and resolves to { url }, the link to hand out. Without it the planner
// shows no share button, as in Home Assistant.
export const sharing = null;
