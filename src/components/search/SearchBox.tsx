import {
  useSearchActions,
} from "@yext/search-headless-react";
import { SearchBar } from "@yext/search-ui-react";
import { LOCATOR_STATIC_FILTER_FIELD, LOCATOR_ENTITY_TYPE } from "src/config";
import GeolocateButton from "src/components/search/GeolocateButton";

const searchFields = [
  {
    fieldApiName: LOCATOR_STATIC_FILTER_FIELD,
    entityType: LOCATOR_ENTITY_TYPE,
  },
];

type SearchBoxProps = {
  title: string;
  subTitle: string;
  placeholderText?: string;
};

const SearchBox = (props: SearchBoxProps) => {
  const { title, subTitle, placeholderText } = props;
  const searchActions = useSearchActions();

  const onSearch = () => {
    if (searchActions.state.filters.static) {
      const filters = searchActions.state.filters.static.filter((filter) => {
        return filter.displayName !== "現在地";
      });
      searchActions.setStaticFilters(filters);
    }
    searchActions.setOffset(0);
    searchActions.resetFacets();
    searchActions.executeVerticalQuery();
  };

  return (
    <div className="shadow-brand-shadow p-6">
      <h1 className="Heading--lead mb-4">{title}</h1>
      <div className="mb-2 text-brand-gray-400">{subTitle}</div>
      <div className="flex items-center">
        <div className="relative w-full h-9">
          <SearchBar
            onSearch={onSearch}
            customCssClasses={{
              inputElement: "w-full",
            }}
          />
        </div>
        <GeolocateButton className="ml-4" />
      </div>
      <div className="flex mb-2 md:mb-0">
      </div>
    </div>
  );
};

export default SearchBox;
