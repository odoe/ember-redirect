import arraySwap from './utils/array-swap';

export default function(routeName, options, container, application) {

    if(!routeName || !options || !options.redirect) {
        return;
    }

    var routeContainerKey = 'route:' + routeName,
        routeObject = container.lookup(routeContainerKey),
        basicRoute;

    // if the routeObject does not exist then we need to generate a basic route in its place
    if(!routeObject) {
        basicRoute = container.lookup('route:basic');
        application.register(routeContainerKey, basicRoute);
        routeObject = container.lookup(routeContainerKey);
    }

    routeObject.reopen({
        beforeModel: function(transition) {
            var newDynamicObject = {},
                thisRouteName = this.routeName,
                routeNames = this.router.router.recognizer.names,
                segmentsOfNextRoute = routeNames[options.redirect].segments,
                segmentsOfThisRoute = routeNames[thisRouteName].segments,
                dynamicSegmentsOfNextRoute = segmentsOfNextRoute.filterBy('name').mapBy('name'),
                dynamicSegmentsOfThisRoute = segmentsOfThisRoute.filterBy('name').mapBy('name');

            // Make sure we only try to make a redirect at the most nested
            // route and not a parent resource.
            if(this.routeName !== transition.targetName) {
                return false;
            }

            // Make sure that the lengths are the same else we are trying to transition to a route that needs more
            // segments then we can supply.
            if(dynamicSegmentsOfNextRoute.length <= dynamicSegmentsOfThisRoute.length) {
                dynamicSegmentsOfNextRoute.forEach(function(item, index) {
                    // This means that we have the same dynamic segment on both this and the next route so we will pair them together.
                    if(dynamicSegmentsOfThisRoute.contains(dynamicSegmentsOfNextRoute[index])) {
                        newDynamicObject[dynamicSegmentsOfNextRoute[index]] = transition.params[thisRouteName][dynamicSegmentsOfNextRoute[index]];
                        dynamicSegmentsOfThisRoute = arraySwap(dynamicSegmentsOfThisRoute, index, dynamicSegmentsOfThisRoute.indexOf(dynamicSegmentsOfNextRoute[index]));
                    }
                    else {
                        newDynamicObject[dynamicSegmentsOfNextRoute[index]] = transition.params[thisRouteName][dynamicSegmentsOfThisRoute[index]];
                    }
                });

                this.replaceWith(transition.router.recognizer.generate(options.redirect, newDynamicObject));
            }

            this._super.apply(this, arguments);
        }
    });

    return routeObject;
}