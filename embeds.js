import { getData, getOrders, getOwners, refreshToken } from "./fetch.js";

const contract = {
  azuki: "0xed5af388653567af2f388e6224dc7c4b3241c544",
  beanz: "0x306b1ea3ecdf94ab739f1910bbda052ed4a9f949",
};

const url = {
  azukiIcon:
    "https://i.seadn.io/gae/H8jOCJuQokNqGBpkBN5wk1oZwO7LM8bNnrHCaekV2nKjnCqw6UB5oaH8XyNeBDj6bA_n1mjejzhFQUP3O1NfjFLHr3FOaeHcTOOT?auto=format&w=1920",
  azukiProfile: "https://www.azuki.com/collector",
  opensea: "https://opensea.io/assets/ethereum",
  looksrare: "https://looksrare.org/collections",
  x2y2: "https://x2y2.io/eth",
  sudoswap: "https://sudoswap.xyz/#/item",
  gem: "https://www.gem.xyz/asset",
};

const promiseHelper = async function (contract, id) {
  return await Promise.all([
    getData(
      `https://api.reservoir.tools/tokens/v5?tokens=${contract}:${id}&includeAttributes=true`
    ),
    getOrders(
      `https://api.reservoir.tools/orders/asks/v3?token=${contract}:${id}&sortBy=price`
    ),
    getOrders(`https://api.reservoir.tools/sales/v4?token=${contract}:${id}`),
  ]);
};

const sortTraits = function (traits) {
  const traitFields = traits.map(function (trait) {
    const capitaliseKey = function (key) {
      return key
        .toLowerCase()
        .split(" ")
        .map((keyword) => keyword.charAt(0).toUpperCase() + keyword.slice(1))
        .join(" ");
    };

    return {
      name: `${capitaliseKey(trait.key)}`,
      value: `${trait.value}`,
      inline: true,
    };
  });

  const paddingLength = 3 - (traits.length % 3);
  if (paddingLength === 3) return traitFields;
  const padding = new Array(paddingLength).fill({
    name: "\u200b",
    value: "\u200b",
    inline: true,
  });
  return traitFields.concat(padding);
};

export const azukiEmbed = async function (id) {
  const [[tokenData], list, lastSale] = await promiseHelper(contract.azuki, id);
  const token = tokenData.token;
  const isFlagged = token.isFlagged ? "⚠️" : "";

  return [
    {
      color: 0xc13540,
      author: {
        name: `Azuki #${id} ${isFlagged}`,
        icon_url: `${token.collection.image}`,
      },
      description: `[Azuki Collector's Profile](${url.azukiProfile}/${token.owner})`,
      fields: [
        ...sortTraits(token.attributes),
        {
          name: "Links",
          value: `[OpenSea](${url.opensea}/${contract.azuki}/${id}) | [LooksRare](${url.looksrare}/${contract.azuki}/${id}) | [X2Y2](${url.x2y2}/${contract.azuki}/${id}) | [SudoSwap](${url.sudoswap}/${contract.azuki}/${id}) | [Gem](${url.gem}/${contract.azuki}/${id})`,
        },
      ],
      image: {
        url: `https://ikzttp.mypinata.cloud/ipfs/QmYDvPAXtiJg7s8JdRBSLWdgSphQdac8j1YuQNNxcGE1hg/${id}.png`,
      },
      footer: {
        text: `Rarity: #${token.rarityRank} | List Price: ${list} | Last Sale: ${lastSale}`,
      },
    },
  ];
};

export const beanzEmbed = async function (id) {
  const [[tokenData], list, lastSale] = await promiseHelper(contract.beanz, id);
  const token = tokenData.token;
  const isFlagged = token.isFlagged ? "⚠️" : "";

  return [
    {
      color: 0xc13540,
      author: {
        name: `Beanz #${id} ${isFlagged}`,
        icon_url: `${token.collection.image}`,
      },
      description: `[Azuki Collector's Profile](${url.azukiProfile}/${token.owner})`,
      fields: [
        ...sortTraits(token.attributes),
        {
          name: "Links",
          value: `[OpenSea](${url.opensea}/${contract.beanz}/${id}) | [LooksRare](${url.looksrare}/${contract.beanz}/${id}) | [X2Y2](${url.x2y2}/${contract.beanz}/${id}) | [SudoSwap](${url.sudoswap}/${contract.beanz}/${id}) | [Gem](${url.gem}/${contract.beanz}/${id})`,
        },
      ],
      image: {
        url: `https://ikzttp.mypinata.cloud/ipfs/QmTRuWHr7bpqscUWFmhXndzf5AdQqkekhqwgbyJCqKMHrL/${id}.png`,
      },
      footer: {
        text: `Rarity: #${token.rarityRank} | List Price: ${list} | Last Sale: ${lastSale}`,
      },
    },
  ];
};

export const findEmbed = async function (data, name, id) {
  try {
    if (!data)
      [data] = await getData(
        `https://api.reservoir.tools/collections/v5?name=${name}&limit=1`
      );

    const address = data?.primaryContract;
    if (!address)
      throw new Error(
        "Collection not found. Please use suggested options that best match your query."
      );

    if (id === undefined) {
      const [uniqueOwners, [dailySaleCount]] = await Promise.all([
        getOwners(
          `https://api.reservoir.tools/collections/${address}/owners-distribution/v1`
        ),
        getData(
          `https://api.reservoir.tools/collections/daily-volumes/v1?id=${address}&limit=1`
        ),
      ]);

      const slug = data.slug;
      const size = Number(data.tokenCount);
      const onSale = Number(data.onSaleCount);
      const symbol = data.floorAsk.price.currency.symbol;
      const dailySale = dailySaleCount?.sales_count
        ? dailySaleCount.sales_count
        : "0";
      const website =
        data.externalUrl !== null ? `[Website](${data.externalUrl}) | ` : "";
      const verified =
        data.openseaVerificationStatus === "verified" ? "✅" : "";
      const royalties = data.royalties?.bps ? data.royalties.bps : 0;

      const volume = function (day) {
        return `${Math.round(data.volume[day]).toLocaleString("en-US")}`;
      };

      return [
        {
          color: 0x0267bc,
          author: {
            name: `${data.name} ${verified}`,
          },
          thumbnail: {
            url: `${data.image}`,
          },
          fields: [
            {
              name: "Collection Size",
              value: `${size.toLocaleString("en-US")}`,
              inline: true,
            },
            {
              name: "Active Listings",
              value: `${onSale.toLocaleString("en-US")} (${(
                (onSale / size) *
                100
              ).toFixed(1)}%)`,
              inline: true,
            },
            {
              name: "Royalties",
              value: `${royalties / 100}%`,
              inline: true,
            },
            {
              name: "Floor Price",
              value: `${data.floorAsk.price.amount.native.toFixed(
                2
              )} ${symbol}`,
              inline: true,
            },
            {
              name: "Unique Owners",
              value: `${uniqueOwners.toLocaleString("en-US")} (${(
                (uniqueOwners / size) *
                100
              ).toFixed(1)}%)`,
              inline: true,
            },
            {
              name: "Daily Sale Count",
              value: `${dailySale.toLocaleString("en-US")}`,
              inline: true,
            },
            {
              name: "Volume (1 / 7 / 30 / All-Time)",
              value: `${volume("1day")} ${symbol} / ${volume(
                "7day"
              )} ${symbol} / ${volume("30day")} ${symbol} / ${volume(
                "allTime"
              )} ${symbol}`,
              inline: false,
            },
            {
              name: "Contract Address",
              value: `[${address}](https://etherscan.io/address/${address})`,
              inline: false,
            },
            {
              name: "Links",
              value: `${website}[OpenSea](https://opensea.io/collection/${slug}) | [LooksRare](https://looksrare.org/collections/${address}) | [X2Y2](https://x2y2.io/collection/${slug}/items) | [SudoSwap](https://sudoswap.xyz/#/browse/buy/${address}) | [Gem](https://www.gem.xyz/collection/${slug}/)`,
            },
          ],
        },
      ];
    }

    if (id >= 0) {
      const [[tokenData], list, lastSale] = await promiseHelper(address, id);
      const token = tokenData?.token;
      if (!token)
        throw new Error(
          `${data.name} #${id} does not exist in the collection.`
        );

      const image = token?.image;
      const attributes = token.attributes;
      if (!image || !attributes.length) {
        const response = await refreshToken(
          "https://api.reservoir.tools/tokens/refresh/v1",
          address,
          id
        );

        if (response.status === 200)
          throw new Error(
            `Metadata not found for ${data.name} #${id}. A metadata refresh has been requested. Please try again in a few minutes.`
          );
      }

      const isFlagged = token.isFlagged ? "⚠️" : "";
      const rarity = token.rarityRank !== null ? `#${token.rarityRank}` : "-";

      return [
        {
          color: 0x0267bc,
          author: {
            name: `${token.collection.name} #${id} ${isFlagged}`,
            icon_url: `${token.collection.image}`,
          },
          fields: [
            ...sortTraits(attributes),
            {
              name: "Links",
              value: `[OpenSea](${url.opensea}/${token.contract}/${id}) | [LooksRare](${url.looksrare}/${token.contract}/${id}) | [X2Y2](${url.x2y2}/${token.contract}/${id}) | [SudoSwap](${url.sudoswap}/${token.contract}/${id}) | [Gem](${url.gem}/${token.contract}/${id})`,
            },
          ],
          image: {
            url: `${image}`,
          },
          footer: {
            text: `Rarity: ${rarity} | List Price: ${list} | Last Sale: ${lastSale}`,
          },
        },
      ];
    }
  } catch (error) {
    throw Error(error.message);
  }
};

export const pairEmbed = function (azukiId, beanzId) {
  return [
    {
      color: 0xc13540,
      author: {
        name: `Azuki #${azukiId} | Beanz #${beanzId}`,
        icon_url: `${url.azukiIcon}`,
      },
      fields: [
        {
          name: "Links to Azuki",
          value: `[OpenSea](${url.opensea}/${contract.azuki}/${azukiId}) | [LooksRare](${url.looksrare}/${contract.azuki}/${azukiId}) | [X2Y2](${url.x2y2}/${contract.azuki}/${azukiId}) | [SudoSwap](${url.sudoswap}/${contract.azuki}/${azukiId}) | [Gem](${url.gem}/${contract.azuki}/${azukiId})`,
        },
        {
          name: "Links to Beanz",
          value: `[OpenSea](${url.opensea}/${contract.beanz}/${beanzId}) | [LooksRare](${url.looksrare}/${contract.beanz}/${beanzId}) | [X2Y2](${url.x2y2}/${contract.beanz}/${beanzId}) | [SudoSwap](${url.sudoswap}/${contract.beanz}/${beanzId}) | [Gem](${url.gem}/${contract.beanz}/${beanzId})`,
        },
      ],
      image: {
        url: `https://azukiimagemaker.vercel.app/api/pairbeanz-prod?azukiId=${azukiId}&beanzId=${beanzId}`,
      },
      footer: {
        text: "Image may take some time to render",
      },
    },
  ];
};

export const etcEmbed = async function (id, imageUrl) {
  const [data] = await getData(
    `https://api.reservoir.tools/tokens/v5?tokens=${contract.azuki}:${id}`
  );

  return [
    {
      color: 0xc13540,
      author: {
        name: `Azuki #${id}`,
        icon_url: `${url.azukiIcon}`,
      },
      description: `[Azuki Collector's Profile](${url.azukiProfile}/${data.token.owner})`,
      fields: [
        {
          name: "Links",
          value: `[OpenSea](${url.opensea}/${contract.azuki}/${id}) | [LooksRare](${url.looksrare}/${contract.azuki}/${id}) | [X2Y2](${url.x2y2}/${contract.azuki}/${id}) | [SudoSwap](${url.sudoswap}/${contract.azuki}/${id}) | [Gem](${url.gem}/${contract.azuki}/${id})`,
        },
      ],
      image: {
        url: `${imageUrl}`,
      },
    },
  ];
};
