import { Default } from 'components/layouts/Default';
import { Home } from 'components/templates/home';
import type { NextPage } from 'next';

const DXENPage: NextPage = () => {
  return (
    <Default pageName="DXEN">
      <Home />
    </Default>
  );
};

export default DXENPage;
