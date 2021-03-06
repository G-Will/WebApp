import { component, mixin, createCell } from 'web-cell';
import { observer } from 'mobx-web-cell';
import { SpinnerBox } from 'boot-cell/source/Prompt/Spinner';
import 'boot-cell/source/Content/EdgeDetector';
import { EdgeEvent } from 'boot-cell/source/Content/EdgeDetector';
import { Table } from 'boot-cell/source/Content/Table';
import { ToggleField } from 'boot-cell/source/Form/ToggleField';

import { User } from '../../service';
import { user } from '../../model';
import { Button } from 'boot-cell/source/Form/Button';

interface UserAdminState {
    loading?: boolean;
    noMore?: boolean;
}

@observer
@component({
    tagName: 'user-admin',
    renderTarget: 'children'
})
export class UserAdmin extends mixin<{}, UserAdminState>() {
    state = {
        loading: false,
        noMore: false
    };

    filter: any;

    connectedCallback() {
        user.getRoles();
    }

    loadMore = async ({ detail }: EdgeEvent) => {
        const { loading, noMore } = this.state;

        if (detail !== 'bottom' || loading || noMore) return;

        await this.setState({ loading: true });

        const data = await user.getNextPage(this.filter);

        await this.setState({ loading: false, noMore: !data });
    };

    search = async (event: Event) => {
        event.preventDefault();

        const { elements } = event.target as HTMLFormElement;
        const { value } = elements.item(0) as HTMLInputElement;

        await this.setState({ loading: true });

        user.clear();
        const data = await user.getNextPage(
            (this.filter = value ? { phone: value } : undefined)
        );
        await this.setState({ loading: false, noMore: !data });
    };

    toggleRole(uid: string, rid: string, { target }: MouseEvent) {
        const { checked } = target as HTMLInputElement;

        return checked ? user.addRole(uid, rid) : user.removeRole(uid, rid);
    }

    renderItem = ({
        mobilePhoneNumber,
        createdAt,
        roles,
        objectId: uid
    }: User) => (
        <tr>
            <td>{mobilePhoneNumber}</td>
            <td>{new Date(createdAt).toLocaleString()}</td>
            <td>
                {user.roles?.map(({ objectId, name }) => (
                    <ToggleField
                        type="checkbox"
                        switch
                        value={objectId}
                        checked={roles.includes(name)}
                        onClick={event => this.toggleRole(uid, objectId, event)}
                    >
                        {name}
                    </ToggleField>
                ))}
            </td>
        </tr>
    );

    render(_, { loading, noMore }: UserAdminState) {
        return (
            <SpinnerBox cover={loading}>
                <header className="d-flex justify-content-between">
                    <h2>用户管理</h2>
                    <form className="form-inline" onSubmit={this.search}>
                        <input
                            type="search"
                            className="form-control mr-3"
                            name="phone"
                        />
                        <Button type="submit">搜索</Button>
                    </form>
                </header>

                <edge-detector onTouchEdge={this.loadMore}>
                    <Table center striped hover>
                        <thead>
                            <tr>
                                <th>手机号</th>
                                <th>注册时间</th>
                                <th>角色</th>
                            </tr>
                        </thead>
                        <tbody>{user.list.map(this.renderItem)}</tbody>
                    </Table>

                    <p slot="bottom" className="text-center mt-2">
                        {noMore ? '没有更多数据了' : '加载更多...'}
                    </p>
                </edge-detector>
            </SpinnerBox>
        );
    }
}
