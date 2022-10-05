import fetch from "node-fetch";

export const getData = async function (url) {
  try {
    const response = await fetch(url);
    const data = await response.json();

    return data;
  } catch (error) {
    console.log(error.message);
  }
};

export const getTraitFields = function (data) {
  const traitFields = data.attributes.map(function (trait) {
    return {
      name: `${trait.trait_type}`,
      value: `${trait.value}`,
      inline: true,
    };
  });

  return traitFields;
};
