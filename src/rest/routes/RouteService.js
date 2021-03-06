r360.RouteService = {

    cache : {},

    /*
     *
     */
    getCfg : function(travelOptions){

        var cfg = { sources : [], targets : [], 
            pathSerializer : travelOptions.getPathSerializer(),
            elevation : travelOptions.isElevationEnabled() };
        
        travelOptions.getSources().forEach(function(source){

            // set the basic information for this source
            var src = {
                lat : r360.has(source, 'lat') ? source.lat : source.getLatLng().lat,
                lng : r360.has(source, 'lon') ? source.lon : r360.has(source, 'lng') ? source.lng : source.getLatLng().lng,
                id  : r360.has(source, 'id')  ? source.id  : '',
                tm  : {}
            };

            var travelType = r360.has(source, 'travelType') ? source.travelType : travelOptions.getTravelType();
            
            src.tm[travelType] = {};

            // set special routing parameters depending on the travel type
            if ( travelType == 'transit' || travelType == 'biketransit' ) {
                
                src.tm[travelType].frame = {};
                if ( !r360.isUndefined(travelOptions.getTime()) ) src.tm[travelType].frame.time = travelOptions.getTime();
                if ( !r360.isUndefined(travelOptions.getDate()) ) src.tm[travelType].frame.date = travelOptions.getDate();
                if ( !r360.isUndefined(travelOptions.getRecommendations()) ) src.tm[travelType].recommendations = travelOptions.getRecommendations();
            }
            if ( travelType == 'ebike' ) {
                
                src.tm.ebike = {};
                if ( !r360.isUndefined(travelOptions.getBikeSpeed()) )     src.tm.ebike.speed    = travelOptions.getBikeSpeed();
                if ( !r360.isUndefined(travelOptions.getBikeUphill()) )    src.tm.ebike.uphill   = travelOptions.getBikeUphill();
                if ( !r360.isUndefined(travelOptions.getBikeDownhill()) )  src.tm.ebike.downhill = travelOptions.getBikeDownhill();
            }
            if ( travelType == 'rentbike' ) {
                
                src.tm.rentbike = {};
                if ( !r360.isUndefined(travelOptions.getBikeSpeed()) )     src.tm.rentbike.bikespeed    = travelOptions.getBikeSpeed();
                if ( !r360.isUndefined(travelOptions.getBikeUphill()) )    src.tm.rentbike.bikeuphill   = travelOptions.getBikeUphill();
                if ( !r360.isUndefined(travelOptions.getBikeDownhill()) )  src.tm.rentbike.bikedownhill = travelOptions.getBikeDownhill();
                if ( !r360.isUndefined(travelOptions.getWalkSpeed()) )     src.tm.rentbike.walkspeed    = travelOptions.getWalkSpeed();
                if ( !r360.isUndefined(travelOptions.getWalkUphill()) )    src.tm.rentbike.walkuphill   = travelOptions.getWalkUphill();
                if ( !r360.isUndefined(travelOptions.getWalkDownhill()) )  src.tm.rentbike.walkdownhill = travelOptions.getWalkDownhill();
            }
            if ( travelType == 'rentandreturnbike' ) {
                
                src.tm.rentandreturnbike = {};
                if ( !r360.isUndefined(travelOptions.getBikeSpeed()) )     src.tm.rentandreturnbike.bikespeed    = travelOptions.getBikeSpeed();
                if ( !r360.isUndefined(travelOptions.getBikeUphill()) )    src.tm.rentandreturnbike.bikeuphill   = travelOptions.getBikeUphill();
                if ( !r360.isUndefined(travelOptions.getBikeDownhill()) )  src.tm.rentandreturnbike.bikedownhill = travelOptions.getBikeDownhill();
                if ( !r360.isUndefined(travelOptions.getWalkSpeed()) )     src.tm.rentandreturnbike.walkspeed    = travelOptions.getWalkSpeed();
                if ( !r360.isUndefined(travelOptions.getWalkUphill()) )    src.tm.rentandreturnbike.walkuphill   = travelOptions.getWalkUphill();
                if ( !r360.isUndefined(travelOptions.getWalkDownhill()) )  src.tm.rentandreturnbike.walkdownhill = travelOptions.getWalkDownhill();
            }
            if ( travelType == 'bike' ) {
                
                src.tm.bike = {};
                if ( !r360.isUndefined(travelOptions.getBikeSpeed()) )     src.tm.bike.speed    = travelOptions.getBikeSpeed();
                if ( !r360.isUndefined(travelOptions.getBikeUphill()) )    src.tm.bike.uphill   = travelOptions.getBikeUphill();
                if ( !r360.isUndefined(travelOptions.getBikeDownhill()) )  src.tm.bike.downhill = travelOptions.getBikeDownhill();
            }
            if ( travelType == 'walk') {
                
                src.tm.walk = {};
                if ( !r360.isUndefined(travelOptions.getWalkSpeed()) )     src.tm.walk.speed    = travelOptions.getWalkSpeed();
                if ( !r360.isUndefined(travelOptions.getWalkUphill()) )    src.tm.walk.uphill   = travelOptions.getWalkUphill();
                if ( !r360.isUndefined(travelOptions.getWalkDownhill()) )  src.tm.walk.downhill = travelOptions.getWalkDownhill();
            }

            // add it to the list of sources
            cfg.sources.push(src);
        });

        cfg.targets = [];
        travelOptions.getTargets().forEach(function(target){

             cfg.targets.push({

                lat : r360.has(target, 'lat') ? target.lat : target.getLatLng().lat,
                lng : r360.has(target, 'lon') ? target.lon : r360.has(target, 'lng') ? target.lng : target.getLatLng().lng,
                id  : r360.has(target, 'id')  ? target.id  : '',
            });
        });

        return cfg;
    },

    /*
     *
     */
    getRoutes : function(travelOptions, successCallback, errorCallback) {

        // swho the please wait control
        if ( travelOptions.getWaitControl() ) {
            travelOptions.getWaitControl().show();
            travelOptions.getWaitControl().updateText(r360.config.i18n.getSpan('routeWait'));
        }

        var cfg = r360.RouteService.getCfg(travelOptions);

        if ( !r360.has(r360.RouteService.cache, JSON.stringify(cfg)) ) {

            // make the request to the Route360° backend 
            $.ajax({
                url         : r360.config.serviceUrl + r360.config.serviceVersion + '/route?cfg=' + encodeURIComponent(JSON.stringify(cfg)) + "&cb=?&key="+r360.config.serviceKey,
                timeout     : r360.config.requestTimeout,
                dataType    : "json",
                success     : function(result) {
                    
                    // hide the please wait control
                    if ( travelOptions.getWaitControl() ) travelOptions.getWaitControl().hide();

                    // the new version is an object, old one an array
                    if ( r360.has(result, 'data')  ) {

                        if ( result.code == 'ok' ) {

                            // cache the result
                            r360.RouteService.cache[JSON.stringify(cfg)] = JSON.parse(JSON.stringify(result.data));
                            // call successCallback with returned results
                            successCallback(r360.Util.parseRoutes(result.data));
                        }
                        else 
                            // check if the error callback is defined
                            if ( r360.isFunction(errorCallback) )
                                errorCallback(result.code, result.message);
                    }
                    // fallback for old clients
                    else {

                        // cache the result
                        r360.RouteService.cache[JSON.stringify(cfg)] = JSON.parse(JSON.stringify(result));
                        // call successCallback with returned results
                        successCallback(r360.Util.parseRoutes(result));
                    }
                },
                // this only happens if the service is not available, all other errors have to be transmitted in the response
                error: function(data){ 

                    // hide the please wait control
                    if ( travelOptions.getWaitControl() ) travelOptions.getWaitControl().hide();

                    // call error callback if defined
                    if ( r360.isFunction(errorCallback) ) {

                        if ( data.status == 403 ) 
                            errorCallback("not-authorized", data.responseText); 
                        else 
                            errorCallback("service-not-available", "The routing service is currently not available, please try again later."); 
                    }
                }
            });
        }
        else { 

            // hide the please wait control
            if ( travelOptions.getWaitControl() ) travelOptions.getWaitControl().hide();
            // call callback with returned results
            successCallback(r360.Util.parseRoutes(JSON.parse(JSON.stringify(r360.RouteService.cache[JSON.stringify(cfg)])))); 
        }
    }
};