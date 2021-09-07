import styled from 'styled-components';

import { useAppSelector, useAppDispatch, useIsMounting } from '@hooks';
import {
  WalletSelectors,
  TokensSelectors,
  TokensActions,
  ModalsActions,
  ModalSelectors,
  VaultsSelectors,
  IronBankSelectors,
  AppSelectors,
} from '@store';

import {
  SummaryCard,
  DetailCard,
  ViewContainer,
  ActionButtons,
  TokenIcon,
  NoWalletCard,
  InfoCard,
  Amount,
} from '@components/app';
import { SpinnerLoading, Text } from '@components/common';
import { halfWidthCss, humanizeAmount, normalizeAmount, normalizeUsdc } from '@src/utils';
import { device } from '@themes/default';

const TokensCard = styled(DetailCard)`
  @media (max-width: 800px) {
    .col-price {
      display: none;
    }
  }
  @media (max-width: 700px) {
    .col-name {
      width: 7rem;
    }
  }
  @media ${device.mobile} {
    .col-balance {
      display: none;
    }
  }
` as typeof DetailCard;

const Row = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  grid-gap: ${({ theme }) => theme.layoutPadding};
  flex-wrap: wrap;
  width: 100%;
`;

const StyledInfoCard = styled(InfoCard)`
  flex: 1;
  ${halfWidthCss}
`;

const StyledNoWalletCard = styled(NoWalletCard)`
  ${halfWidthCss}
  width: 100%;
`;

export const Wallet = () => {
  // TODO: Add translation
  // const { t } = useAppTranslation('common');
  const dispatch = useAppDispatch();
  const isMounting = useIsMounting();
  const walletIsConnected = useAppSelector(WalletSelectors.selectWalletIsConnected);
  const { totalBalance } = useAppSelector(TokensSelectors.selectSummaryData);
  const userTokens = useAppSelector(TokensSelectors.selectUserTokens);
  const activeModal = useAppSelector(ModalSelectors.selectActiveModal);
  const vaultsUnderlyingTokens = useAppSelector(VaultsSelectors.selectUnderlyingTokensAddresses);
  const ironBankUnderlyingTokens = useAppSelector(IronBankSelectors.selectUnderlyingTokensAddresses);

  const appStatus = useAppSelector(AppSelectors.selectAppStatus);
  const tokensListStatus = useAppSelector(TokensSelectors.selectWalletTokensStatus);
  const generalLoading = (appStatus.loading || tokensListStatus.loading || isMounting) && !activeModal;

  const actionHandler = (action: string, tokenAddress: string) => {
    switch (action) {
      case 'invest':
        dispatch(TokensActions.setSelectedTokenAddress({ tokenAddress }));
        dispatch(ModalsActions.openModal({ modalName: 'depositTx' }));
        break;
      case 'supply':
        dispatch(TokensActions.setSelectedTokenAddress({ tokenAddress }));
        dispatch(ModalsActions.openModal({ modalName: 'IronBankSupplyTx' }));
        break;
      default:
        break;
    }
  };

  const investButton = (tokenAddress: string, isZapable: boolean) => {
    return [
      {
        name: 'Invest',
        handler: () => actionHandler('invest', tokenAddress),
        disabled: !walletIsConnected || !(isZapable || vaultsUnderlyingTokens.includes(tokenAddress)),
      },
    ];
  };

  const supplyButton = (tokenAddress: string) => {
    return [
      {
        name: 'Supply',
        handler: () => actionHandler('supply', tokenAddress),
        disabled: !walletIsConnected || !ironBankUnderlyingTokens.includes(tokenAddress),
      },
    ];
  };

  return (
    <ViewContainer>
      <SummaryCard
        header="Dashboard"
        items={[{ header: 'Available to Invest', Component: <Amount value={totalBalance} input="usdc" /> }]}
        variant="secondary"
        cardSize="small"
      />

      <Row>
        <StyledInfoCard
          header="What's in Your Wallet?"
          Component={
            <Text>
              “Wallet” is a great place to put your idling capital to work.
              <br />
              <br />
              Choose token and either invest or lend it in a couple of clicks.
              <br />
              No distractions and lengthy text pages – you know why you are here.
            </Text>
          }
          cardSize="big"
        />

        <StyledInfoCard
          header="Yearn passes $5B TVL!"
          Component={
            <Text>
              Total Value Locked (TVL) is a key indicator of the scale of Yearn and DeFi. <br />
              With $5B TVL, Yearn is the 8th largest DeFi protocol. Yearn is not a bank, but fun fact: the average US
              bank has $3.1B in deposits according to mx.com.
              <br />
              <br />
              Over $5B in holdings have been deposited into the Yearn suite of products.
            </Text>
          }
          cardSize="big"
        />
      </Row>

      {!walletIsConnected && <StyledNoWalletCard />}

      {generalLoading && walletIsConnected && <SpinnerLoading flex="1" width="100%" />}
      {!generalLoading && walletIsConnected && (
        <TokensCard
          header="Tokens"
          metadata={[
            {
              key: 'displayIcon',
              transform: ({ displayIcon, symbol }) => <TokenIcon icon={displayIcon} symbol={symbol} />,
              width: '6rem',
              className: 'col-icon',
            },
            { key: 'displayName', header: 'Name', sortable: true, width: '17rem', className: 'col-name' },
            {
              key: 'tokenBalance',
              header: 'Balance',
              format: ({ balance, decimals }) => humanizeAmount(balance, decimals, 2),
              sortable: true,
              width: '13rem',
              className: 'col-balance',
            },
            {
              key: 'priceUsdc',
              header: 'Price',
              format: ({ priceUsdc }) => normalizeUsdc(priceUsdc, 2),
              sortable: true,
              width: '11rem',
              className: 'col-price',
            },
            {
              key: 'balanceUsdc',
              header: 'Value',
              format: ({ balanceUsdc }) => normalizeUsdc(balanceUsdc, 2),
              sortable: true,
              width: '11rem',
              className: 'col-value',
            },
            {
              key: 'invest',
              transform: ({ address, isZapable }) => (
                <ActionButtons actions={[...supplyButton(address), ...investButton(address, isZapable)]} />
              ),
              align: 'flex-end',
              width: 'auto',
              grow: '1',
            },
          ]}
          data={userTokens.map((token) => ({
            ...token,
            displayName: token.symbol,
            displayIcon: token.icon ?? '',
            tokenBalance: normalizeAmount(token.balance, token.decimals),
            supply: null,
            invest: null,
          }))}
          initialSortBy="balanceUsdc"
          wrap
        />
      )}
    </ViewContainer>
  );
};