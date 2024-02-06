import { useCallback, useEffect, useState } from "react";
import { useSearchActions, useSearchState, Matcher, SelectableStaticFilter } from "@yext/search-headless-react";
import { Map } from "@yext/pages/components";
import { GoogleMaps } from "@yext/components-tsx-maps";
import { Coordinate, GeoBounds } from '@yext/components-tsx-geo';
import { useBreakpoint } from "src/common/useBreakpoints";
import {
  useHandleSearchParams,
  useLoadInitialSearchParams,
} from "src/components/search/utils/handleSearchParams";
import { useGetSearchResults } from "src/components/search/utils/useGetSearchResults";
import { LocatorProvider } from "./utils/useLocator";
import { LocationProfile } from "src/types/entities";
import "src/components/search/Locator.css";
import mapStyles from "src/components/search/defaultMapStyles.json";
import SearchBox from "src/components/search/SearchBox";
import LocatorCard from "src/components/cards/LocatorCard";
import ResultInfo from "src/components/search/ResultInfo";
import ResultList from "src/components/search/ResultList";
import CustomMarker from "src/components/search/CustomMarker";
import LoadingSpinner from "src/components/common/LoadingSpinner";
import { GEOLOCATE_RADIUS, PS_API_KEY } from "src/config";

type LocatorProps = {
  // Will display results up to the verticalLimit (default 20, change with searchActions.setVerticalLimit(num))
  displayAllOnNoResults?: boolean;
  placeholderText?: string;
  subTitle: string;
  title: string;
  allResultsOnLoad?: boolean;
};

const Locator = (props: LocatorProps) => {
  const {
    displayAllOnNoResults = false,
    allResultsOnLoad = false,
    placeholderText,
    subTitle,
    title,
  } = props;
  const [selectedEntityId, setSelectedEntityId] = useState("");
  const [focusedEntityId, setFocusedEntityId] = useState("");
  const [hoveredEntityId, setHoveredEntityId] = useState("");

  const searchActions = useSearchActions();
  const isLoading = useSearchState((state) => state.searchStatus.isLoading);
  const isDesktopBreakpoint = useBreakpoint("sm");
  const [allLocationsLoaded, setAllLocationsLoaded] = useState(false);
  const [initialParamsLoaded, setInitialParamsLoaded] = useState(false);
  const initialParamsLoadedCallback = useCallback(
    () => setInitialParamsLoaded(true),
    [setInitialParamsLoaded]
  );

  const [showSearchAreaButton, setShowSearchAreaButton] = useState(false);
  const [mapCenter, setMapCenter] = useState<Coordinate>();
  const [mapBounds, setMapBounds] = useState<GeoBounds>();


  // const queryId = useSearchState(state => state.query.queryId);
  // const [ areaSearchStatus, setAreaSearchStatus ] = useState<AreaSearchStatus>({ inProgress: false });

  // Load static and facet filters on page load.
  useLoadInitialSearchParams(initialParamsLoaded, initialParamsLoadedCallback);
  // Update the search params whenever the search state filters property changes.
  useHandleSearchParams(initialParamsLoaded);

  // Unset any selected, hovered, or focused markers on new search
  useEffect(() => {
    setSelectedEntityId("");
    setFocusedEntityId("");
    setHoveredEntityId("");
  }, [searchActions.state.query.queryId]);

  const results = useGetSearchResults<LocationProfile>(
    displayAllOnNoResults,
    allResultsOnLoad,
    () => {
      setAllLocationsLoaded(true);
    }
  );

  const handleDrag = (previousBounds: GeoBounds, currentBounds: GeoBounds) => {
    setMapCenter(currentBounds.getCenter());
    setMapBounds(currentBounds);
    setShowSearchAreaButton(true);
  };
  const handleSearchAreaClick = () => {
    if (mapCenter && mapBounds) {
      const { latitude, longitude } = mapCenter;
      const searchRadius = mapBounds.ne.distanceTo(mapCenter) * 1609;
      const locationFilter: SelectableStaticFilter = {
        selected: true,
        displayName: "Current map area",
        filter: {
          kind: "fieldValue",
          fieldId: "builtin.location",
          value: {
            lat: latitude,
            lng: longitude,
            radius: searchRadius,
          },
          matcher: Matcher.Near,
        },
      };
      searchActions.setStaticFilters([locationFilter]);
      searchActions.executeVerticalQuery();
      setShowSearchAreaButton(false);
    }
  };

  return (
    <LocatorProvider
      value={{
        results,
        selectedId: selectedEntityId,
        setSelectedId: setSelectedEntityId,
        focusedId: focusedEntityId,
        setFocusedId: setFocusedEntityId,
        hoveredId: hoveredEntityId,
        setHoveredId: setHoveredEntityId,
      }}
    >
      <div className="Locator">
        {(!initialParamsLoaded ||
          isLoading ||
          (allResultsOnLoad && !allLocationsLoaded)) && <LoadingSpinner />}
        <div className="Locator-content">
          <SearchBox
            title={title}
            subTitle={subTitle}
            placeholderText={placeholderText}
          />
          <ResultInfo />
          <ResultList CardComponent={LocatorCard} />
        </div>
        {isDesktopBreakpoint && (
          <div className="Locator-map">
            <Map
              provider={GoogleMaps}
              providerOptions={{ styles: mapStyles }}
              bounds={results.map((data) => data.rawData.yextDisplayCoordinate)}
              padding={{ top: 100, bottom: 200, left: 50, right: 50 }}
              className="h-full"
              clientKey="gme-yextinc"
              // defaultCenter={{ latitude: 35.67980, longitude: 139.77100 }} //Japan
              // defaultZoom={5}
              panHandler={handleDrag}
              // panStartHandler={panStartHandler}
              // apiKey={MAPS_API_KEY}
            >
              {results.map((data, index) => (
                <CustomMarker
                  key={data.rawData.id}
                  coordinate={data.rawData.yextDisplayCoordinate}
                  id={data.rawData.id}
                  index={index + 1}
                />
              ))}
            </Map>
            {showSearchAreaButton && (
              <div className="absolute bottom-10 left-0 right-0 flex justify-center">
                <button
                  onClick={handleSearchAreaClick}
                  className="rounded-2xl border bg-white py-2 px-4 shadow-xl"
                >
                  <p>Search This Area</p>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </LocatorProvider>
  );
};

export default Locator;
